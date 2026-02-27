import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/supabase/tables';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    const searchParams = request.nextUrl.searchParams;

    // Filters
    const severity = searchParams.get('severity');
    const type = searchParams.get('type');
    const convenio = searchParams.get('convenio');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    const supabase = await createClient();

    let query = supabase
      .from(TABLES.divergences)
      .select('*', { count: 'exact' })
      .eq('session_id', sessionId)
      .order('severity', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (severity) query = query.eq('severity', severity);
    if (type) query = query.eq('type', type);
    if (convenio) query = query.ilike('convenio_name', `%${convenio}%`);
    if (status) query = query.eq('resolution_status', status);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also get summary by type/severity for filter UI
    const { data: summary } = await supabase
      .from(TABLES.divergences)
      .select('type, severity')
      .eq('session_id', sessionId);

    const typeCounts: Record<string, number> = {};
    const severityCounts: Record<string, number> = {};
    for (const d of summary ?? []) {
      typeCounts[d.type] = (typeCounts[d.type] || 0) + 1;
      severityCounts[d.severity] = (severityCounts[d.severity] || 0) + 1;
    }

    return NextResponse.json({
      data,
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
      summary: { typeCounts, severityCounts },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
