import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/supabase/tables';
import { requireAdmin } from '@/lib/supabase/session';

export async function GET() {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const [doctors, clinics, sessions, uploads] = await Promise.all([
      supabase.from(TABLES.doctors).select('id, is_active', { count: 'exact', head: true }),
      supabase.from(TABLES.clinics).select('id', { count: 'exact', head: true }),
      supabase.from(TABLES.conferenceSessions).select('id, status, total_valor_repassado'),
      supabase.from(TABLES.uploads).select('id, status', { count: 'exact', head: true }),
    ]);

    const completedSessions = sessions.data?.filter((s) => s.status === 'completed') ?? [];
    const totalRevenue = completedSessions.reduce(
      (sum, s) => sum + (Number(s.total_valor_repassado) || 0), 0,
    );

    return NextResponse.json({
      totalDoctors: doctors.count ?? 0,
      totalClinics: clinics.count ?? 0,
      totalSessions: sessions.data?.length ?? 0,
      completedSessions: completedSessions.length,
      totalUploads: uploads.count ?? 0,
      totalRevenue,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized') return NextResponse.json({ error: message }, { status: 401 });
    if (message === 'Forbidden') return NextResponse.json({ error: message }, { status: 403 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
