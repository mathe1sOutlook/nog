import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/supabase/tables';
import { requireAuth } from '@/lib/supabase/session';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();
    const clinicId = request.nextUrl.searchParams.get('clinic_id') || user.clinics[0]?.id;

    let query = supabase
      .from(TABLES.repasseRecords)
      .select('convenio_original, valor_bruto, glosa, a_repassar')
      .eq('doctor_id', user.doctorId);

    if (clinicId) query = query.eq('clinic_id', clinicId);

    const { data: records, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const map = new Map<string, { total_bruto: number; total_glosa: number; total_repassado: number; count: number }>();

    for (const r of records ?? []) {
      const key = r.convenio_original ?? 'Desconhecido';
      const e = map.get(key) ?? { total_bruto: 0, total_glosa: 0, total_repassado: 0, count: 0 };
      e.total_bruto += Number(r.valor_bruto) || 0;
      e.total_glosa += Number(r.glosa) || 0;
      e.total_repassado += Number(r.a_repassar) || 0;
      e.count++;
      map.set(key, e);
    }

    const ranking = [...map.entries()]
      .map(([convenio, stats]) => ({ convenio, ...stats }))
      .sort((a, b) => b.total_repassado - a.total_repassado);

    return NextResponse.json(ranking);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized') return NextResponse.json({ error: message }, { status: 401 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
