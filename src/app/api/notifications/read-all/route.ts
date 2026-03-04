import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/supabase/tables';
import { requireAuth } from '@/lib/supabase/session';

export async function PATCH() {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { error } = await supabase
      .from(TABLES.notifications)
      .update({ read: true })
      .eq('doctor_id', user.doctorId)
      .eq('read', false);

    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized') return NextResponse.json({ error: message }, { status: 401 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
