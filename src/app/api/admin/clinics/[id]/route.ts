import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/supabase/tables';
import { requireAdmin } from '@/lib/supabase/session';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = await createClient();

    const { data: clinic, error } = await supabase
      .from(TABLES.clinics)
      .select(`
        id, name, slug, igut_subdomain, address, created_at, updated_at,
        ${TABLES.doctorClinics}(doctor_id, active, joined_at, ${TABLES.doctors}(id, full_name, email, is_active, specialty))
      `)
      .eq('id', id)
      .single();

    if (error || !clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    // Get rules for this clinic
    const [taxConfigs, repasseRules, deductions] = await Promise.all([
      supabase.from(TABLES.taxConfigs).select('*').eq('clinic_id', id).order('procedure_category'),
      supabase.from(TABLES.repasseRules).select('*').eq('clinic_id', id).order('created_at', { ascending: false }),
      supabase.from(TABLES.monthlyDeductions).select('*').eq('clinic_id', id).order('deduction_type'),
    ]);

    return NextResponse.json({
      ...clinic,
      taxConfigs: taxConfigs.data ?? [],
      repasseRules: repasseRules.data ?? [],
      deductions: deductions.data ?? [],
    });
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
    if (body.name !== undefined) updates.name = body.name;
    if (body.slug !== undefined) updates.slug = body.slug;
    if (body.igut_subdomain !== undefined) updates.igut_subdomain = body.igut_subdomain;
    if (body.address !== undefined) updates.address = body.address;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from(TABLES.clinics)
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
