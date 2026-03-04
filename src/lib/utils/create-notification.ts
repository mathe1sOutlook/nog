import { SupabaseClient } from '@supabase/supabase-js';
import { TABLES } from '@/lib/supabase/tables';

interface NotificationParams {
  doctorId: string;
  clinicId?: string;
  type: 'conference_completed' | 'critical_divergence' | 'upload_completed' | 'upload_failed' | 'system';
  title: string;
  message: string;
  link?: string;
}

export async function createNotification(
  supabase: SupabaseClient,
  params: NotificationParams,
) {
  await supabase.from(TABLES.notifications).insert({
    doctor_id: params.doctorId,
    clinic_id: params.clinicId ?? null,
    type: params.type,
    title: params.title,
    message: params.message,
    link: params.link ?? null,
  });
}
