import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/supabase/tables';
import { requireAdmin } from '@/lib/supabase/session';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = await createClient();

    const { data: doctor, error } = await supabase
      .from(TABLES.doctors)
      .select(`
        id, full_name, email, crm, specialty, role, is_active, avatar_url, created_at, updated_at,
        ${TABLES.doctorClinics}(clinic_id, active, joined_at, ${TABLES.clinics}(id, name, slug))
      `)
      .eq('id', id)
      .single();

    if (error || !doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Get recent sessions
    const { data: sessions } = await supabase
      .from(TABLES.conferenceSessions)
      .select('id, name, status, created_at, completed_at, total_matched, total_divergences, total_valor_repassado')
      .eq('doctor_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get recent uploads
    const { data: uploads } = await supabase
      .from(TABLES.uploads)
      .select('id, file_type, file_name, status, records_imported, created_at')
      .eq('doctor_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({ ...doctor, sessions: sessions ?? [], uploads: uploads ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized') return NextResponse.json({ error: message }, { status: 401 });
    if (message === 'Forbidden') return NextResponse.json({ error: message }, { status: 403 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (body.full_name !== undefined) updates.full_name = body.full_name;
    if (body.email !== undefined) updates.email = body.email;
    if (body.crm !== undefined) updates.crm = body.crm;
    if (body.specialty !== undefined) updates.specialty = body.specialty;
    if (body.role !== undefined) updates.role = body.role;
    if (body.is_active !== undefined) updates.is_active = body.is_active;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from(TABLES.doctors)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized') return NextResponse.json({ error: message }, { status: 401 });
    if (message === 'Forbidden') return NextResponse.json({ error: message }, { status: 403 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = await createClient();

    // Soft delete: deactivate instead of hard delete
    const { error } = await supabase
      .from(TABLES.doctors)
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized') return NextResponse.json({ error: message }, { status: 401 });
    if (message === 'Forbidden') return NextResponse.json({ error: message }, { status: 403 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
