import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/supabase/tables';
import { requireAuth } from '@/lib/supabase/session';

export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { count, error } = await supabase
      .from(TABLES.notifications)
      .select('id', { count: 'exact', head: true })
      .eq('doctor_id', user.doctorId)
      .eq('read', false);

    if (error) throw new Error(error.message);
    return NextResponse.json({ count: count ?? 0 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized') return NextResponse.json({ error: message }, { status: 401 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
