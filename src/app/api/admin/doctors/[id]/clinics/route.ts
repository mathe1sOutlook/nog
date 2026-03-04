import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/supabase/tables';
import { requireAdmin } from '@/lib/supabase/session';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id: doctorId } = await params;
    const supabase = await createClient();
    const { clinic_id } = await request.json();

    const { error } = await supabase
      .from(TABLES.doctorClinics)
      .upsert(
        { doctor_id: doctorId, clinic_id, active: true },
        { onConflict: 'doctor_id,clinic_id' },
      );

    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized') return NextResponse.json({ error: message }, { status: 401 });
    if (message === 'Forbidden') return NextResponse.json({ error: message }, { status: 403 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id: doctorId } = await params;
    const supabase = await createClient();
    const { clinic_id } = await request.json();

    const { error } = await supabase
      .from(TABLES.doctorClinics)
      .update({ active: false })
      .eq('doctor_id', doctorId)
      .eq('clinic_id', clinic_id);

    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized') return NextResponse.json({ error: message }, { status: 401 });
    if (message === 'Forbidden') return NextResponse.json({ error: message }, { status: 403 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
