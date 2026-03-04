import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/supabase/tables';
import { requireAdmin } from '@/lib/supabase/session';

export async function GET() {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from(TABLES.doctors)
      .select(`
        id, full_name, email, crm, specialty, role, is_active, avatar_url, created_at,
        ${TABLES.doctorClinics}(clinic_id, active, ${TABLES.clinics}(id, name, slug))
      `)
      .order('full_name');

    if (error) throw new Error(error.message);
    return NextResponse.json(data ?? []);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized') return NextResponse.json({ error: message }, { status: 401 });
    if (message === 'Forbidden') return NextResponse.json({ error: message }, { status: 403 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from(TABLES.doctors)
      .insert({
        full_name: body.full_name,
        email: body.email,
        crm: body.crm ?? null,
        specialty: body.specialty ?? null,
        role: body.role ?? 'doctor',
        is_active: true,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Associate clinics if provided
    if (body.clinic_ids?.length) {
      await supabase.from(TABLES.doctorClinics).insert(
        body.clinic_ids.map((cid: string) => ({
          doctor_id: data.id,
          clinic_id: cid,
          active: true,
        })),
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized') return NextResponse.json({ error: message }, { status: 401 });
    if (message === 'Forbidden') return NextResponse.json({ error: message }, { status: 403 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
