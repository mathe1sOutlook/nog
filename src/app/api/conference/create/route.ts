import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/supabase/tables';
import { DEFAULT_DOCTOR_ID, DEFAULT_CLINIC_ID } from '@/lib/utils/constants';
import { runMatching, type ProductionEntry, type RepasseEntry } from '@/lib/etl/matching/matcher';
import { detectDivergences } from '@/lib/etl/analysis/divergence-detector';

interface CreateConferenceBody {
  production_upload_id: string;
  repasse_upload_id: string;
  name?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateConferenceBody = await request.json();
    const { production_upload_id, repasse_upload_id, name } = body;

    if (!production_upload_id || !repasse_upload_id) {
      return NextResponse.json(
        { error: 'Both production_upload_id and repasse_upload_id are required' },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // 1. Fetch production records
    const { data: productionRows, error: prodError } = await supabase
      .from(TABLES.productionRecords)
      .select('*')
      .eq('upload_id', production_upload_id)
      .eq('generates_repasse', true);

    if (prodError) {
      return NextResponse.json({ error: prodError.message }, { status: 500 });
    }

    // 2. Fetch repasse records
    const { data: repasseRows, error: repError } = await supabase
      .from(TABLES.repasseRecords)
      .select('*')
      .eq('upload_id', repasse_upload_id);

    if (repError) {
      return NextResponse.json({ error: repError.message }, { status: 500 });
    }

    // 3. Get upload periods
    const { data: prodUpload } = await supabase
      .from(TABLES.uploads)
      .select('period_start, period_end')
      .eq('id', production_upload_id)
      .single();

    const { data: repUpload } = await supabase
      .from(TABLES.uploads)
      .select('period_start, period_end')
      .eq('id', repasse_upload_id)
      .single();

    // 4. Create conference session
    const { data: session, error: sessionError } = await supabase
      .from(TABLES.conferenceSessions)
      .insert({
        doctor_id: DEFAULT_DOCTOR_ID,
        clinic_id: DEFAULT_CLINIC_ID,
        name: name || `Conferência ${new Date().toLocaleDateString('pt-BR')}`,
        status: 'matching',
        production_upload_id,
        repasse_upload_id,
        production_period_start: prodUpload?.period_start,
        production_period_end: prodUpload?.period_end,
        repasse_period_start: repUpload?.period_start,
        repasse_period_end: repUpload?.period_end,
        total_production_records: productionRows.length,
        total_repasse_records: repasseRows.length,
      })
      .select()
      .single();

    if (sessionError) {
      return NextResponse.json({ error: sessionError.message }, { status: 500 });
    }

    // 5. Transform for matching engine
    const productionEntries: ProductionEntry[] = productionRows.map((r) => ({
      id: r.id,
      patient_name_normalized: r.patient_name_normalized,
      service_date: r.service_date,
      convenio_normalized: r.convenio_original?.toUpperCase().trim() ?? '',
      convenio_original: r.convenio_original ?? '',
      procedure_original: r.procedure_original ?? '',
      categories: r.procedure_original ? r.procedure_original.split('|').map((s: string) => s.trim()) : [],
    }));

    const repasseEntries: RepasseEntry[] = repasseRows.map((r) => ({
      id: r.id,
      patient_name_normalized: r.patient_name_normalized,
      service_date: r.service_date,
      convenio_normalized: r.convenio_original?.toUpperCase().trim() ?? '',
      convenio_original: r.convenio_original ?? '',
      tuss_code: r.tuss_code ?? '',
      procedure_description: r.procedure_description ?? '',
      valor_bruto: Number(r.valor_bruto) || 0,
      glosa: Number(r.glosa) || 0,
      imposto: Number(r.imposto) || 0,
      liquido: Number(r.liquido) || 0,
      a_repassar: Number(r.a_repassar) || 0,
      regra_pct: Number(r.regra_pct) || 0,
    }));

    // 6. Run matching
    const matchingResult = runMatching(productionEntries, repasseEntries);

    // 7. Save matches to DB
    if (matchingResult.matches.length > 0) {
      const matchRows = matchingResult.matches.map((m) => ({
        session_id: session.id,
        production_record_id: m.production_id,
        repasse_record_id: m.repasse_id,
        match_type: m.match_type,
        match_confidence: m.confidence,
      }));

      for (let i = 0; i < matchRows.length; i += 500) {
        const batch = matchRows.slice(i, i + 500);
        await supabase.from(TABLES.matches).insert(batch);
      }

      // Update match_status on production records
      const matchedProdIds = [...new Set(matchingResult.matches.map((m) => m.production_id))];
      for (let i = 0; i < matchedProdIds.length; i += 100) {
        const batch = matchedProdIds.slice(i, i + 100);
        await supabase
          .from(TABLES.productionRecords)
          .update({ match_status: 'matched' })
          .in('id', batch);
      }

      // Update match_status on repasse records
      const matchedRepIds = [...new Set(matchingResult.matches.map((m) => m.repasse_id))];
      for (let i = 0; i < matchedRepIds.length; i += 100) {
        const batch = matchedRepIds.slice(i, i + 100);
        await supabase
          .from(TABLES.repasseRecords)
          .update({ match_status: 'matched' })
          .in('id', batch);
      }
    }

    // 8. Build matched pairs for divergence detection
    const prodDbMap = new Map(productionRows.map((r) => [r.id, r]));
    const repDbMap = new Map(repasseRows.map((r) => [r.id, r]));
    const prodEntryMap = new Map(productionEntries.map((p) => [p.id, p]));
    const repEntryMap = new Map(repasseEntries.map((r) => [r.id, r]));

    // Group matches by production ID
    const matchesByProd = new Map<string, string[]>();
    for (const m of matchingResult.matches) {
      const existing = matchesByProd.get(m.production_id) || [];
      existing.push(m.repasse_id);
      matchesByProd.set(m.production_id, existing);
    }

    const matchedPairs = [...matchesByProd.entries()].map(([prodId, repIds]) => {
      const dbRow = prodDbMap.get(prodId);
      const entry = prodEntryMap.get(prodId);
      return {
        production: {
          id: prodId,
          service_date: entry?.service_date ?? '',
          patient_name: dbRow?.patient_name ?? '',
          convenio_original: entry?.convenio_original ?? '',
          procedure_original: entry?.procedure_original ?? '',
          categories: entry?.categories ?? [],
        },
        repasseRecords: repIds.map((repId) => {
          const rDb = repDbMap.get(repId);
          const rEntry = repEntryMap.get(repId);
          return {
            id: repId,
            service_date: rEntry?.service_date ?? '',
            patient_name: rDb?.patient_name ?? '',
            convenio_original: rEntry?.convenio_original ?? '',
            tuss_code: rEntry?.tuss_code ?? '',
            procedure_description: rEntry?.procedure_description ?? '',
            valor_bruto: rEntry?.valor_bruto ?? 0,
            glosa: rEntry?.glosa ?? 0,
            imposto: rEntry?.imposto ?? 0,
            liquido: rEntry?.liquido ?? 0,
            a_repassar: rEntry?.a_repassar ?? 0,
            regra_pct: rEntry?.regra_pct ?? 0,
            category_slug: rDb?.category_slug ?? '',
          };
        }),
      };
    });

    const unmatchedProd = matchingResult.unmatchedProduction.map((id) => {
      const dbRow = prodDbMap.get(id);
      const entry = prodEntryMap.get(id);
      return {
        id,
        service_date: entry?.service_date ?? '',
        patient_name: dbRow?.patient_name ?? '',
        convenio_original: entry?.convenio_original ?? '',
        procedure_original: entry?.procedure_original ?? '',
        categories: entry?.categories ?? [],
      };
    });

    const unmatchedRep = matchingResult.unmatchedRepasse.map((id) => {
      const dbRow = repDbMap.get(id);
      const entry = repEntryMap.get(id);
      return {
        id,
        service_date: entry?.service_date ?? '',
        patient_name: dbRow?.patient_name ?? '',
        convenio_original: entry?.convenio_original ?? '',
        tuss_code: entry?.tuss_code ?? '',
        procedure_description: entry?.procedure_description ?? '',
        valor_bruto: entry?.valor_bruto ?? 0,
        glosa: entry?.glosa ?? 0,
        imposto: entry?.imposto ?? 0,
        liquido: entry?.liquido ?? 0,
        a_repassar: entry?.a_repassar ?? 0,
        regra_pct: entry?.regra_pct ?? 0,
        category_slug: dbRow?.category_slug ?? '',
      };
    });

    // 9. Detect divergences
    const divergenceInputs = detectDivergences(matchedPairs, unmatchedProd, unmatchedRep);

    // 10. Save divergences to DB
    if (divergenceInputs.length > 0) {
      const divergenceRows = divergenceInputs.map((d) => ({
        session_id: session.id,
        type: d.type,
        severity: d.severity,
        service_date: d.service_date,
        patient_name: d.patient_name,
        convenio_name: d.convenio_name,
        production_record_id: d.production_record_id,
        repasse_record_id: d.repasse_record_id,
        valor_esperado: d.valor_esperado,
        valor_recebido: d.valor_recebido,
        diferenca: d.diferenca,
        procedure_production: d.procedure_production,
        procedure_repasse: d.procedure_repasse,
        detail: d.detail,
      }));

      for (let i = 0; i < divergenceRows.length; i += 500) {
        const batch = divergenceRows.slice(i, i + 500);
        await supabase.from(TABLES.divergences).insert(batch);
      }
    }

    // 11. Calculate totals
    const totalValorBruto = repasseEntries.reduce((sum, r) => sum + r.valor_bruto, 0);
    const totalValorRepassado = repasseEntries.reduce((sum, r) => sum + r.a_repassar, 0);
    const valorDivergente = divergenceInputs
      .filter((d) => d.diferenca !== null)
      .reduce((sum, d) => sum + Math.abs(d.diferenca!), 0);

    // 12. Update session with final KPIs
    await supabase
      .from(TABLES.conferenceSessions)
      .update({
        status: 'completed',
        total_matched: matchingResult.matches.length,
        total_unmatched_production: matchingResult.unmatchedProduction.length,
        total_unmatched_repasse: matchingResult.unmatchedRepasse.length,
        total_divergences: divergenceInputs.length,
        total_valor_bruto: totalValorBruto,
        total_valor_repassado: totalValorRepassado,
        total_valor_divergente: valorDivergente,
        completed_at: new Date().toISOString(),
      })
      .eq('id', session.id);

    return NextResponse.json({
      session_id: session.id,
      total_production: productionRows.length,
      total_repasse: repasseRows.length,
      total_matched: matchingResult.matches.length,
      total_unmatched_production: matchingResult.unmatchedProduction.length,
      total_unmatched_repasse: matchingResult.unmatchedRepasse.length,
      total_divergences: divergenceInputs.length,
      total_valor_bruto: totalValorBruto,
      total_valor_repassado: totalValorRepassado,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
