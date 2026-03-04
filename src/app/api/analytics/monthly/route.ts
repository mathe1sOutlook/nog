import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/supabase/session';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();
    const clinicId = request.nextUrl.searchParams.get('clinic_id') || user.clinics[0]?.id;
    const months = parseInt(request.nextUrl.searchParams.get('months') ?? '12', 10);

    if (!clinicId) {
      return NextResponse.json({ error: 'clinic_id is required' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('nog_monthly_summary', {
      p_doctor_id: user.doctorId,
      p_clinic_id: clinicId,
      p_months: months,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized') return NextResponse.json({ error: message }, { status: 401 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
