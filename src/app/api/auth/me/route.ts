import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/supabase/tables';
import { getCurrentUser } from '@/lib/supabase/session';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(null, { status: 401 });
  }

  // If admin is impersonating, return impersonated doctor's data
  const impersonateId = request.cookies.get('nog-impersonate')?.value;
  if (impersonateId && user.role === 'admin') {
    const supabase = await createClient();

    const { data: doctor } = await supabase
      .from(TABLES.doctors)
      .select('id, full_name, email, avatar_url')
      .eq('id', impersonateId)
      .single();

    if (doctor) {
      const { data: doctorClinics } = await supabase
        .from(TABLES.doctorClinics)
        .select(`clinic_id, ${TABLES.clinics}(id, name, slug)`)
        .eq('doctor_id', doctor.id)
        .eq('active', true);

      const clinics = (doctorClinics ?? [])
        .map((dc: Record<string, unknown>) => dc[TABLES.clinics] as { id: string; name: string; slug: string } | null)
        .filter(Boolean) as { id: string; name: string; slug: string }[];

      return NextResponse.json({
        doctorId: doctor.id,
        role: 'doctor' as const,
        fullName: doctor.full_name,
        email: doctor.email ?? '',
        avatarUrl: doctor.avatar_url ?? null,
        clinics,
        impersonating: true,
        adminName: user.fullName,
      });
    }
  }

  return NextResponse.json(user);
}
