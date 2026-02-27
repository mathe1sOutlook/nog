import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/supabase/tables';
import { DEFAULT_DOCTOR_ID } from '@/lib/utils/constants';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from(TABLES.conferenceSessions)
      .select('*')
      .eq('doctor_id', DEFAULT_DOCTOR_ID)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
