import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/supabase/tables';
import { DEFAULT_DOCTOR_ID, DEFAULT_CLINIC_ID } from '@/lib/utils/constants';
import type { ParsedRepasseRecord } from '@/lib/etl/parsers/repasse-parser';

interface UploadRepasseBody {
  file_name: string;
  records: ParsedRepasseRecord[];
  periodStart: string | null;
  periodEnd: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body: UploadRepasseBody = await request.json();
    const { file_name, records, periodStart, periodEnd } = body;

    if (!records || records.length === 0) {
      return NextResponse.json({ error: 'No records provided' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Create upload record
    const { data: upload, error: uploadError } = await supabase
      .from(TABLES.uploads)
      .insert({
        doctor_id: DEFAULT_DOCTOR_ID,
        clinic_id: DEFAULT_CLINIC_ID,
        file_type: 'repasse',
        file_name,
        status: 'processing',
        period_start: periodStart,
        period_end: periodEnd,
        records_parsed: records.length,
      })
      .select()
      .single();

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // 2. Insert repasse records (batch)
    const repasseRows = records.map((r) => ({
      upload_id: upload.id,
      doctor_id: DEFAULT_DOCTOR_ID,
      clinic_id: DEFAULT_CLINIC_ID,
      service_date: r.service_date,
      service_time: r.service_time || null,
      patient_name: r.patient_name,
      patient_name_normalized: r.patient_name_normalized,
      convenio_original: r.convenio_original,
      tuss_code: r.tuss_code,
      procedure_description: r.procedure_description,
      category_slug: r.category_slug,
      payment_form: r.payment_form,
      valor_bruto: r.valor_bruto,
      glosa: r.glosa,
      imposto: r.imposto,
      liquido: r.liquido,
      a_repassar: r.a_repassar,
      regra_pct: r.regra_pct,
      match_status: 'unmatched',
    }));

    let totalImported = 0;
    for (let i = 0; i < repasseRows.length; i += 500) {
      const batch = repasseRows.slice(i, i + 500);
      const { error: insertError } = await supabase
        .from(TABLES.repasseRecords)
        .insert(batch);

      if (insertError) {
        await supabase
          .from(TABLES.uploads)
          .update({ status: 'failed', error_message: insertError.message })
          .eq('id', upload.id);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      totalImported += batch.length;
    }

    // 3. Mark upload complete
    await supabase
      .from(TABLES.uploads)
      .update({
        status: 'completed',
        records_imported: totalImported,
        processed_at: new Date().toISOString(),
      })
      .eq('id', upload.id);

    return NextResponse.json({
      upload_id: upload.id,
      records_imported: totalImported,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
