import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/supabase/tables';
import { requireAdmin } from '@/lib/supabase/session';

// POST: Start impersonation
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const { doctor_id } = await request.json();
    const supabase = await createClient();

    // Verify target doctor exists
    const { data: doctor } = await supabase
      .from(TABLES.doctors)
      .select('id, full_name')
      .eq('id', doctor_id)
      .single();

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    const response = NextResponse.json({ ok: true, doctor_name: doctor.full_name });
    response.cookies.set('nog-impersonate', doctor_id, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 4, // 4 hours
    });

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized') return NextResponse.json({ error: message }, { status: 401 });
    if (message === 'Forbidden') return NextResponse.json({ error: message }, { status: 403 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE: Stop impersonation
export async function DELETE() {
  try {
    await requireAdmin();

    const response = NextResponse.json({ ok: true });
    response.cookies.delete('nog-impersonate');

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized') return NextResponse.json({ error: message }, { status: 401 });
    if (message === 'Forbidden') return NextResponse.json({ error: message }, { status: 403 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
