import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/supabase/tables';
import { requireAuth } from '@/lib/supabase/session';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();
    const clinicId = request.nextUrl.searchParams.get('clinic_id') || user.clinics[0]?.id;

    // Latest completed session for KPIs
    let sessionQuery = supabase
      .from(TABLES.conferenceSessions)
      .select('*')
      .eq('doctor_id', user.doctorId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1);

    if (clinicId) sessionQuery = sessionQuery.eq('clinic_id', clinicId);
    const { data: sessions } = await sessionQuery;
    const latest = sessions?.[0] ?? null;

    // Divergence breakdown for latest session
    let divergencesByType: { type: string; count: number }[] = [];
    let divergencesByConvenio: { convenio: string; alta: number; media: number; baixa: number }[] = [];

    if (latest) {
      const { data: divs } = await supabase
        .from(TABLES.divergences)
        .select('type, severity, convenio_name')
        .eq('session_id', latest.id);

      if (divs) {
        const typeMap = new Map<string, number>();
        const convMap = new Map<string, { alta: number; media: number; baixa: number }>();

        for (const d of divs) {
          typeMap.set(d.type, (typeMap.get(d.type) ?? 0) + 1);
          const conv = d.convenio_name ?? 'Desconhecido';
          const c = convMap.get(conv) ?? { alta: 0, media: 0, baixa: 0 };
          if (d.severity === 'ALTA') c.alta++;
          else if (d.severity === 'MEDIA') c.media++;
          else c.baixa++;
          convMap.set(conv, c);
        }

        divergencesByType = [...typeMap.entries()].map(([type, count]) => ({ type, count }));
        divergencesByConvenio = [...convMap.entries()]
          .map(([convenio, counts]) => ({ convenio, ...counts }))
          .sort((a, b) => (b.alta + b.media + b.baixa) - (a.alta + a.media + a.baixa))
          .slice(0, 10);
      }
    }

    // Sparkline: last 6 completed sessions
    let sparkQuery = supabase
      .from(TABLES.conferenceSessions)
      .select('total_production_records, total_valor_repassado, total_divergences, total_matched, completed_at')
      .eq('doctor_id', user.doctorId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: true })
      .limit(6);
    if (clinicId) sparkQuery = sparkQuery.eq('clinic_id', clinicId);
    const { data: sparkSessions } = await sparkQuery;

    // Recent sessions
    let recentQuery = supabase
      .from(TABLES.conferenceSessions)
      .select('id, name, status, created_at, total_matched, total_divergences, total_production_records')
      .eq('doctor_id', user.doctorId)
      .order('created_at', { ascending: false })
      .limit(5);
    if (clinicId) recentQuery = recentQuery.eq('clinic_id', clinicId);
    const { data: recentSessions } = await recentQuery;

    const totalProd = latest?.total_production_records ?? 0;
    const kpi = latest ? {
      totalProduction: totalProd,
      totalRepasse: latest.total_repasse_records ?? 0,
      totalRepasseValue: Number(latest.total_valor_repassado) || 0,
      totalDivergences: latest.total_divergences ?? 0,
      divergencesAlta: divergencesByType.find((d) => d.type.includes('SEM_REPASSE'))?.count ?? 0,
      divergencesMedia: 0,
      divergencesBaixa: 0,
      matchRate: totalProd > 0
        ? Math.round(((latest.total_matched ?? 0) / totalProd) * 1000) / 10
        : 0,
    } : null;

    const spark = sparkSessions ?? [];
    const sparklines = {
      production: spark.map((s) => s.total_production_records ?? 0),
      repasse: spark.map((s) => Number(s.total_valor_repassado) || 0),
      divergences: spark.map((s) => s.total_divergences ?? 0),
      matchRate: spark.map((s) => {
        const t = s.total_production_records ?? 0;
        return t > 0 ? Math.round(((s.total_matched ?? 0) / t) * 1000) / 10 : 0;
      }),
    };

    return NextResponse.json({
      kpi,
      divergencesByType,
      divergencesByConvenio,
      sparklines,
      recentSessions: recentSessions ?? [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized') return NextResponse.json({ error: message }, { status: 401 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
