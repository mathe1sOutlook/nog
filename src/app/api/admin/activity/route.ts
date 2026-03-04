import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/supabase/tables';
import { requireAdmin } from '@/lib/supabase/session';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const page = Number(request.nextUrl.searchParams.get('page') ?? '1');
    const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') ?? '50'), 100);
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from(TABLES.auditLog)
      .select(`
        id, action, entity_type, entity_id, metadata, created_at,
        actor:actor_id(id, full_name, email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    return NextResponse.json({
      data: data ?? [],
      total: count ?? 0,
      page,
      limit,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized') return NextResponse.json({ error: message }, { status: 401 });
    if (message === 'Forbidden') return NextResponse.json({ error: message }, { status: 403 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
