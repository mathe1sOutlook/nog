'use client';

import { KpiCards } from '@/components/dashboard/kpi-cards';
import {
  DivergenceByTypeChart,
  DivergenceByConvenioChart,
} from '@/components/dashboard/divergence-charts';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { Sparkline } from '@/components/dashboard/sparkline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Upload, GitCompare, Sparkles, FileCheck2, Banknote, AlertTriangle, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useDashboardData } from '@/lib/hooks/use-dashboard-data';
import { formatBRL, formatNumber, formatPercent } from '@/lib/utils/formatting';

function KpiWithSparkline({
  title, value, subtitle, icon: Icon, glow, iconTone, sparkData, sparkColor, className, index,
}: {
  title: string; value: string; subtitle: string; icon: React.ElementType;
  glow: string; iconTone: string; sparkData: number[]; sparkColor: string;
  className?: string; index: number;
}) {
  return (
    <Card
      className={cn(
        'group relative overflow-hidden bg-card/85 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10',
        'animate-in fade-in-0 slide-in-from-bottom-2',
        className,
      )}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <span className={cn('pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl', glow)} />
      <CardHeader className="relative flex flex-row items-center justify-between pb-1">
        <CardTitle className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </CardTitle>
        <span className={cn('rounded-lg border p-2 shadow-sm', iconTone)}>
          <Icon className="h-4 w-4" />
        </span>
      </CardHeader>
      <CardContent className="relative">
        <div className="flex items-end justify-between gap-2">
          <div>
            <div className="mb-1 text-2xl font-bold tracking-tight text-foreground">{value}</div>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          {sparkData.length >= 2 && (
            <Sparkline data={sparkData} color={sparkColor} width={72} height={28} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full rounded-3xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[340px] rounded-xl" />
        <Skeleton className="h-[340px] rounded-xl" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useDashboardData();

  if (isLoading) return <DashboardSkeleton />;

  const kpi = data?.kpi;
  const sparklines = data?.sparklines;

  return (
    <div className="space-y-6">
      <section className="soft-surface relative overflow-hidden rounded-3xl p-6 sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 bottom-0 h-44 w-44 rounded-full bg-emerald-400/20 blur-3xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/50 px-3 py-1 text-xs font-semibold text-primary dark:border-white/10 dark:bg-white/5">
              <Sparkles className="h-3.5 w-3.5" />
              Resumo operacional
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Visao geral das conferencias e divergencias de repasse.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/upload">
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/conference/new">
                <GitCompare className="mr-2 h-4 w-4" />
                Nova conferencia
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {kpi && sparklines ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiWithSparkline
            index={0}
            title="Total produzido"
            value={formatNumber(kpi.totalProduction)}
            subtitle="atendimentos"
            icon={FileCheck2}
            glow="bg-sky-500/20"
            iconTone="text-sky-700 bg-sky-100/70 border-sky-200/70 dark:text-sky-400 dark:bg-sky-900/40 dark:border-sky-700/40"
            sparkData={sparklines.production}
            sparkColor="#0ea5e9"
          />
          <KpiWithSparkline
            index={1}
            title="Total repassado"
            value={formatBRL(kpi.totalRepasseValue)}
            subtitle={`${formatNumber(kpi.totalRepasse)} registros`}
            icon={Banknote}
            glow="bg-emerald-500/20"
            iconTone="text-emerald-700 bg-emerald-100/70 border-emerald-200/70 dark:text-emerald-400 dark:bg-emerald-900/40 dark:border-emerald-700/40"
            sparkData={sparklines.repasse}
            sparkColor="#10b981"
          />
          <KpiWithSparkline
            index={2}
            title="Divergencias"
            value={formatNumber(kpi.totalDivergences)}
            subtitle={`${kpi.divergencesAlta} alta, ${kpi.divergencesMedia} media, ${kpi.divergencesBaixa} baixa`}
            icon={AlertTriangle}
            glow="bg-rose-500/18"
            iconTone="text-rose-700 bg-rose-100/70 border-rose-200/70 dark:text-rose-400 dark:bg-rose-900/40 dark:border-rose-700/40"
            sparkData={sparklines.divergences}
            sparkColor="#f43f5e"
            className={kpi.divergencesAlta > 0 ? 'border-rose-200/60' : ''}
          />
          <KpiWithSparkline
            index={3}
            title="Taxa de conferencia"
            value={formatPercent(kpi.matchRate)}
            subtitle="match rate"
            icon={BarChart3}
            glow={kpi.matchRate >= 90 ? 'bg-emerald-500/18' : kpi.matchRate >= 70 ? 'bg-amber-500/20' : 'bg-rose-500/18'}
            iconTone={
              kpi.matchRate >= 90
                ? 'text-emerald-700 bg-emerald-100/70 border-emerald-200/70 dark:text-emerald-400 dark:bg-emerald-900/40'
                : kpi.matchRate >= 70
                  ? 'text-amber-700 bg-amber-100/70 border-amber-200/70 dark:text-amber-400 dark:bg-amber-900/40'
                  : 'text-rose-700 bg-rose-100/70 border-rose-200/70 dark:text-rose-400 dark:bg-rose-900/40'
            }
            sparkData={sparklines.matchRate}
            sparkColor={kpi.matchRate >= 90 ? '#10b981' : kpi.matchRate >= 70 ? '#f59e0b' : '#f43f5e'}
          />
        </div>
      ) : (
        <KpiCards data={{ totalProduction: 0, totalRepasse: 0, totalRepasseValue: 0, totalDivergences: 0, divergencesAlta: 0, divergencesMedia: 0, divergencesBaixa: 0, matchRate: 0 }} />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <DivergenceByTypeChart data={data?.divergencesByType ?? []} />
        <DivergenceByConvenioChart data={data?.divergencesByConvenio ?? []} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ActivityFeed sessions={data?.recentSessions ?? []} />
        {kpi && kpi.totalDivergences > 50 && (
          <Card className="border-amber-200/60 bg-amber-50/65 dark:border-amber-700/40 dark:bg-amber-950/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Destaque</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground">
                <span className="font-semibold">{formatNumber(kpi.totalDivergences)} divergencias</span> detectadas na ultima conferencia.
                Recomenda-se revisar os casos de alta prioridade.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link href="/conference">Ver conferencias</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
