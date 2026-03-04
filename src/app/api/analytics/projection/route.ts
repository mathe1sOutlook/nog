import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/supabase/tables';
import { requireAuth } from '@/lib/supabase/session';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();
    const clinicId = request.nextUrl.searchParams.get('clinic_id') || user.clinics[0]?.id;

    if (!clinicId) {
      return NextResponse.json({ error: 'clinic_id is required' }, { status: 400 });
    }

    // Last 6 months
    const { data } = await supabase.rpc('nog_monthly_summary', {
      p_doctor_id: user.doctorId,
      p_clinic_id: clinicId,
      p_months: 6,
    });

    const months = (data ?? []) as Array<{
      month: string;
      total_bruto: number;
      total_repassado: number;
      total_divergences: number;
    }>;

    if (months.length === 0) {
      return NextResponse.json({ historical: [], projected: [], deductions: 0, taxRate: 0 });
    }

    // Weighted moving average
    const weights = [1, 1.5, 2, 2.5, 3, 3.5];
    const values = months.map((m) => Number(m.total_repassado) || 0);
    const usable = weights.slice(weights.length - values.length);
    const totalWeight = usable.reduce((s, w) => s + w, 0);
    const wma = values.reduce((s, v, i) => s + v * usable[i], 0) / totalWeight;

    // Project 3 months
    const lastMonth = new Date(months[months.length - 1].month);
    const projected = Array.from({ length: 3 }, (_, i) => {
      const d = new Date(lastMonth);
      d.setMonth(d.getMonth() + i + 1);
      return {
        month: d.toISOString().slice(0, 10),
        projected_value: Math.round(wma * 100) / 100,
        upper_bound: Math.round(wma * 1.15 * 100) / 100,
        lower_bound: Math.round(wma * 0.85 * 100) / 100,
      };
    });

    // Deductions
    const { data: deductions } = await supabase
      .from(TABLES.monthlyDeductions)
      .select('amount')
      .eq('doctor_id', user.doctorId)
      .eq('clinic_id', clinicId)
      .eq('active', true);

    const totalDeductions = (deductions ?? []).reduce((s, d) => s + (Number(d.amount) || 0), 0);

    // Tax
    const { data: taxConfig } = await supabase
      .from(TABLES.taxConfigs)
      .select('rate')
      .eq('doctor_id', user.doctorId)
      .eq('clinic_id', clinicId)
      .eq('active', true);

    const taxRate = taxConfig?.[0] ? Number(taxConfig[0].rate) / 100 : 0;

    const adjustedProjected = projected.map((p) => ({
      ...p,
      net_value: Math.round((p.projected_value - totalDeductions) * (1 - taxRate) * 100) / 100,
      net_upper: Math.round((p.upper_bound - totalDeductions) * (1 - taxRate) * 100) / 100,
      net_lower: Math.round((p.lower_bound - totalDeductions) * (1 - taxRate) * 100) / 100,
    }));

    return NextResponse.json({
      historical: months.map((m) => ({
        month: m.month,
        total_repassado: Number(m.total_repassado) || 0,
        total_bruto: Number(m.total_bruto) || 0,
        total_divergences: Number(m.total_divergences) || 0,
      })),
      projected: adjustedProjected,
      deductions: totalDeductions,
      taxRate: taxRate * 100,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized') return NextResponse.json({ error: message }, { status: 401 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
