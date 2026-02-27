/**
 * Divergence detection logic.
 * Ported from etl_conferencia.py lines 334-437.
 */

import type { DivergenceType, Severity } from '@/lib/types/database';

export interface DivergenceInput {
  type: DivergenceType;
  severity: Severity;
  service_date: string | null;
  patient_name: string | null;
  convenio_name: string | null;
  production_record_id: string | null;
  repasse_record_id: string | null;
  valor_esperado: number | null;
  valor_recebido: number | null;
  diferenca: number | null;
  procedure_production: string | null;
  procedure_repasse: string | null;
  detail: string;
}

interface ProductionForAnalysis {
  id: string;
  service_date: string;
  patient_name: string;
  convenio_original: string;
  procedure_original: string;
  categories: string[];
}

interface RepasseForAnalysis {
  id: string;
  service_date: string;
  patient_name: string;
  convenio_original: string;
  tuss_code: string;
  procedure_description: string;
  valor_bruto: number;
  glosa: number;
  imposto: number;
  liquido: number;
  a_repassar: number;
  regra_pct: number;
  category_slug: string;
}

interface MatchPair {
  production: ProductionForAnalysis;
  repasseRecords: RepasseForAnalysis[];
}

const TOLERANCE = 0.05; // R$0.05 tolerance for float comparison

/**
 * Detect divergences from matching results.
 */
export function detectDivergences(
  matchedPairs: MatchPair[],
  unmatchedProduction: ProductionForAnalysis[],
  unmatchedRepasse: RepasseForAnalysis[],
): DivergenceInput[] {
  const divergences: DivergenceInput[] = [];

  // 1. Production without repasse (MOST CRITICAL)
  for (const p of unmatchedProduction) {
    divergences.push({
      type: 'PRODUZIDO_SEM_REPASSE',
      severity: 'ALTA',
      service_date: p.service_date,
      patient_name: p.patient_name,
      convenio_name: p.convenio_original,
      production_record_id: p.id,
      repasse_record_id: null,
      valor_esperado: null,
      valor_recebido: null,
      diferenca: null,
      procedure_production: p.procedure_original,
      procedure_repasse: null,
      detail: `Atendimento consta na produção (${p.categories.join(', ')}) mas não foi encontrado no repasse.`,
    });
  }

  // 2. Repasse without production (lower severity — may be from prior month)
  for (const r of unmatchedRepasse) {
    divergences.push({
      type: 'REPASSE_SEM_PRODUCAO',
      severity: 'BAIXA',
      service_date: r.service_date,
      patient_name: r.patient_name,
      convenio_name: r.convenio_original,
      production_record_id: null,
      repasse_record_id: r.id,
      valor_esperado: null,
      valor_recebido: r.a_repassar,
      diferenca: null,
      procedure_production: null,
      procedure_repasse: `${r.tuss_code} ${r.procedure_description}`,
      detail: `Repasse registrado mas não encontrado na produção. Pode ser de período anterior. Valor: R$ ${r.valor_bruto.toFixed(2)}, Regra: ${r.regra_pct}%`,
    });
  }

  // 3. Analyze matched pairs for value/percentage divergences
  for (const pair of matchedPairs) {
    const { production, repasseRecords } = pair;

    for (const r of repasseRecords) {
      // Check for unexpected gloss
      if (r.glosa > 0) {
        divergences.push({
          type: 'GLOSA_INESPERADA',
          severity: 'MEDIA',
          service_date: r.service_date,
          patient_name: r.patient_name,
          convenio_name: r.convenio_original,
          production_record_id: production.id,
          repasse_record_id: r.id,
          valor_esperado: r.valor_bruto,
          valor_recebido: r.valor_bruto - r.glosa,
          diferenca: -r.glosa,
          procedure_production: production.procedure_original,
          procedure_repasse: `${r.tuss_code} ${r.procedure_description}`,
          detail: `Glosa de R$ ${r.glosa.toFixed(2)} aplicada. Valor bruto: R$ ${r.valor_bruto.toFixed(2)}, Líquido: R$ ${r.liquido.toFixed(2)}`,
        });
      }

      // Check percentage correctness
      if (r.regra_pct > 0 && r.liquido > 0) {
        const expectedRepasse = r.liquido * (r.regra_pct / 100);
        const diff = Math.abs(r.a_repassar - expectedRepasse);
        if (diff > TOLERANCE) {
          divergences.push({
            type: 'PERCENTUAL_INCORRETO',
            severity: 'ALTA',
            service_date: r.service_date,
            patient_name: r.patient_name,
            convenio_name: r.convenio_original,
            production_record_id: production.id,
            repasse_record_id: r.id,
            valor_esperado: expectedRepasse,
            valor_recebido: r.a_repassar,
            diferenca: r.a_repassar - expectedRepasse,
            procedure_production: production.procedure_original,
            procedure_repasse: `${r.tuss_code} ${r.procedure_description}`,
            detail: `Percentual ${r.regra_pct}% aplicado sobre líquido R$ ${r.liquido.toFixed(2)} deveria dar R$ ${expectedRepasse.toFixed(2)}, mas recebeu R$ ${r.a_repassar.toFixed(2)}`,
          });
        }
      }
    }

    // Check if production has exams but repasse only has consultations
    const prodHasExam = production.categories.some((c) =>
      ['VIDEO_NASO', 'VIDEO_LARINGO', 'VIDEO_GENERICO', 'FEES', 'CERUMEN'].includes(c.toUpperCase()),
    );
    const repasseHasExam = repasseRecords.some((r) =>
      ['video_naso', 'video_laringo', 'video_generico', 'fees', 'cerumen'].includes(r.category_slug),
    );

    if (prodHasExam && !repasseHasExam && repasseRecords.length > 0) {
      divergences.push({
        type: 'EXAME_NAO_PAGO',
        severity: 'ALTA',
        service_date: production.service_date,
        patient_name: production.patient_name,
        convenio_name: production.convenio_original,
        production_record_id: production.id,
        repasse_record_id: repasseRecords[0].id,
        valor_esperado: null,
        valor_recebido: null,
        diferenca: null,
        procedure_production: production.procedure_original,
        procedure_repasse: repasseRecords.map((r) => `${r.tuss_code} ${r.procedure_description}`).join(' | '),
        detail: `Produção inclui exame (${production.categories.join(', ')}) mas repasse só contém consulta.`,
      });
    }
  }

  return divergences;
}
