import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/supabase/tables';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    const supabase = await createClient();

    const { data: divergences, error } = await supabase
      .from(TABLES.divergences)
      .select('*')
      .eq('session_id', sessionId)
      .order('severity', { ascending: true })
      .order('type', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Build CSV
    const headers = [
      'Severidade', 'Tipo', 'Data', 'Paciente', 'Convênio',
      'Procedimento (Produção)', 'Procedimento (Repasse)',
      'Valor Esperado', 'Valor Recebido', 'Diferença',
      'Status', 'Detalhe',
    ];

    const rows = (divergences ?? []).map((d) => [
      d.severity,
      d.type,
      d.service_date ?? '',
      d.patient_name ?? '',
      d.convenio_name ?? '',
      d.procedure_production ?? '',
      d.procedure_repasse ?? '',
      d.valor_esperado?.toString() ?? '',
      d.valor_recebido?.toString() ?? '',
      d.diferenca?.toString() ?? '',
      d.resolution_status,
      `"${(d.detail ?? '').replace(/"/g, '""')}"`,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="divergencias-${sessionId.slice(0, 8)}.csv"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
