import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/supabase/tables';
import { DEFAULT_DOCTOR_ID, DEFAULT_CLINIC_ID } from '@/lib/utils/constants';
import type { ParsedProductionRecord } from '@/lib/etl/parsers/production-parser';

interface UploadProductionBody {
  file_name: string;
  records: ParsedProductionRecord[];
  periodStart: string | null;
  periodEnd: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body: UploadProductionBody = await request.json();
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
        file_type: 'production',
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

    // 2. Insert production records (batch)
    const productionRows = records.map((r) => ({
      upload_id: upload.id,
      doctor_id: DEFAULT_DOCTOR_ID,
      clinic_id: DEFAULT_CLINIC_ID,
      row_number: r.row_number,
      service_date: r.service_date,
      patient_name: r.patient_name,
      patient_name_normalized: r.patient_name_normalized,
      convenio_original: r.convenio_original,
      procedure_original: r.procedure_original,
      generates_repasse: r.generates_repasse,
      match_status: 'unmatched',
    }));

    // Insert in batches of 500
    let totalImported = 0;
    for (let i = 0; i < productionRows.length; i += 500) {
      const batch = productionRows.slice(i, i + 500);
      const { error: insertError } = await supabase
        .from(TABLES.productionRecords)
        .insert(batch);

      if (insertError) {
        // Mark upload as failed
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
