import { createClient } from './server';
import { TABLES } from './tables';

export interface CurrentUser {
  doctorId: string;
  role: 'admin' | 'doctor';
  fullName: string;
  email: string;
  avatarUrl: string | null;
  clinics: { id: string; name: string; slug: string }[];
}

/**
 * Get the currently authenticated user from Supabase Auth,
 * mapped to their nog_doctors record and associated clinics.
 * Returns null if not authenticated or not a registered doctor.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Find doctor by auth_user_id
  const { data: doctor } = await supabase
    .from(TABLES.doctors)
    .select('id, role, full_name, avatar_url, is_active')
    .eq('auth_user_id', user.id)
    .single();

  if (!doctor || !doctor.is_active) return null;

  // Get associated clinics
  const { data: doctorClinics } = await supabase
    .from(TABLES.doctorClinics)
    .select(`clinic_id, ${TABLES.clinics}(id, name, slug)`)
    .eq('doctor_id', doctor.id)
    .eq('active', true);

  const clinics = (doctorClinics ?? [])
    .map((dc: Record<string, unknown>) => dc[TABLES.clinics] as { id: string; name: string; slug: string } | null)
    .filter(Boolean) as { id: string; name: string; slug: string }[];

  return {
    doctorId: doctor.id,
    role: doctor.role as 'admin' | 'doctor',
    fullName: doctor.full_name,
    email: user.email ?? '',
    avatarUrl: doctor.avatar_url,
    clinics,
  };
}

/**
 * Require authentication. Throws if not authenticated.
 * Use in API routes for clean error handling.
 */
export async function requireAuth(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

/**
 * Require admin role. Throws if not admin.
 */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireAuth();
  if (user.role !== 'admin') {
    throw new Error('Forbidden');
  }
  return user;
}
