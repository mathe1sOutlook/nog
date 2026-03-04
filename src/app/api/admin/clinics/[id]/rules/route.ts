import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/supabase/tables';
import { requireAdmin } from '@/lib/supabase/session';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = await createClient();

    const [taxConfigs, repasseRules, deductions] = await Promise.all([
      supabase.from(TABLES.taxConfigs).select('*').eq('clinic_id', id).order('procedure_category'),
      supabase.from(TABLES.repasseRules).select('*').eq('clinic_id', id).order('created_at', { ascending: false }),
      supabase.from(TABLES.monthlyDeductions).select('*').eq('clinic_id', id).order('deduction_type'),
    ]);

    return NextResponse.json({
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

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id: clinicId } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { rule_type } = body;

    if (rule_type === 'tax') {
      const { error } = await supabase.from(TABLES.taxConfigs).insert({
        clinic_id: clinicId,
        doctor_id: body.doctor_id,
        procedure_category: body.procedure_category,
        tax_rate: body.tax_rate,
        description: body.description ?? null,
        effective_from: body.effective_from,
        effective_to: body.effective_to ?? null,
      });
      if (error) throw new Error(error.message);
    } else if (rule_type === 'repasse') {
      const { error } = await supabase.from(TABLES.repasseRules).insert({
        clinic_id: clinicId,
        convenio_id: body.convenio_id ?? null,
        category_id: body.category_id ?? null,
        repasse_pct: body.repasse_pct,
        effective_from: body.effective_from,
        effective_to: body.effective_to ?? null,
        notes: body.notes ?? null,
      });
      if (error) throw new Error(error.message);
    } else if (rule_type === 'deduction') {
      const { error } = await supabase.from(TABLES.monthlyDeductions).insert({
        doctor_id: body.doctor_id,
        clinic_id: clinicId,
        deduction_type: body.deduction_type,
        amount: body.amount,
        effective_from: body.effective_from,
        effective_to: body.effective_to ?? null,
      });
      if (error) throw new Error(error.message);
    } else {
      return NextResponse.json({ error: 'Invalid rule_type' }, { status: 400 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized') return NextResponse.json({ error: message }, { status: 401 });
    if (message === 'Forbidden') return NextResponse.json({ error: message }, { status: 403 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
