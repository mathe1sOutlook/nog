'use client';

import { useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Banknote, AlertCircle, Hash } from 'lucide-react';
import { ExportMenu } from '@/components/shared/export-menu';
import { useConvenioRanking } from '@/lib/hooks/use-convenio-ranking';
import { useECharts } from '@/lib/hooks/use-echarts';
import { useEChartsTheme } from '@/lib/hooks/use-echarts-theme';
import { formatBRL, formatNumber } from '@/lib/utils/formatting';

function RankingChart({ data }: { data: Array<{ convenio: string; total_repassado: number; total_glosa: number }> }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const theme = useEChartsTheme();
  const top10 = data.slice(0, 10);

  const option = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: theme.tooltipBg,
      borderColor: theme.tooltipBorder,
      textStyle: { color: theme.isDark ? '#e5e7eb' : '#1f2a37', fontSize: 12 },
    },
    legend: {
      bottom: 0,
      textStyle: { fontSize: 11, color: theme.textColor },
    },
    grid: { left: 150, right: 24, top: 14, bottom: 42 },
    yAxis: {
      type: 'category',
      data: top10.map((d) => d.convenio).reverse(),
      axisLabel: { fontSize: 10, width: 130, overflow: 'truncate', color: theme.textColor },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    xAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: theme.splitLineColor } },
      axisLabel: {
        color: theme.textColor,
        fontSize: 10,
        formatter: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v),
      },
    },
    series: [
      {
        name: 'Repassado',
        type: 'bar',
        stack: 'total',
        barMaxWidth: 20,
        data: top10.map((d) => d.total_repassado).reverse(),
        color: '#10b981',
        itemStyle: { borderRadius: [0, 4, 4, 0] },
      },
      {
        name: 'Glosa',
        type: 'bar',
        stack: 'total',
        barMaxWidth: 20,
        data: top10.map((d) => d.total_glosa).reverse(),
        color: '#f59e0b',
        itemStyle: { borderRadius: [0, 4, 4, 0] },
      },
    ],
    animationDuration: 600,
  }), [top10, theme]);

  useECharts(chartRef, option);

  return <div ref={chartRef} className="h-[380px] w-full" />;
}

function KpiMini({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: string; tone: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className={`rounded-lg border p-2 shadow-sm ${tone}`}>
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ConvenioRankingPage() {
  const { data, isLoading } = useConvenioRanking();

  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;
    const topPayer = data[0];
    const topGlosa = [...data].sort((a, b) => b.total_glosa - a.total_glosa)[0];
    const totalCount = data.reduce((s, d) => s + d.count, 0);
    return { topPayer, topGlosa, totalConvenios: data.length, totalCount };
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-primary">
            <Trophy className="h-5 w-5" />
            <h1 className="text-2xl font-bold tracking-tight">Ranking de convenios</h1>
          </div>
          <p className="text-sm text-muted-foreground">Analise de repasse e glosa por convenio.</p>
        </div>
        <ExportMenu
          disabled={!data || data.length === 0}
          onExportPDF={async () => {
            if (!data) return;
            const { exportPDF } = await import('@/lib/utils/export-pdf');
            exportPDF({
              title: 'Ranking de Convenios',
              headers: ['#', 'Convenio', 'Registros', 'Valor Bruto', 'Glosa', 'Repassado'],
              rows: data.map((r, i) => [i + 1, r.convenio, r.count, r.total_bruto, r.total_glosa, r.total_repassado]),
              filename: 'ranking-convenios',
            });
          }}
          onExportExcel={async () => {
            if (!data) return;
            const { exportExcel } = await import('@/lib/utils/export-excel');
            exportExcel({
              sheetName: 'Ranking Convenios',
              headers: ['#', 'Convenio', 'Registros', 'Valor Bruto', 'Glosa', 'Repassado'],
              rows: data.map((r, i) => [i + 1, r.convenio, r.count, r.total_bruto, r.total_glosa, r.total_repassado]),
              filename: 'ranking-convenios',
            });
          }}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiMini
            icon={Banknote}
            label="Maior pagador"
            value={stats.topPayer.convenio.slice(0, 20)}
            tone="text-emerald-700 bg-emerald-100/70 border-emerald-200/70 dark:text-emerald-400 dark:bg-emerald-900/40 dark:border-emerald-700/40"
          />
          <KpiMini
            icon={AlertCircle}
            label="Mais glosa"
            value={stats.topGlosa.convenio.slice(0, 20)}
            tone="text-amber-700 bg-amber-100/70 border-amber-200/70 dark:text-amber-400 dark:bg-amber-900/40 dark:border-amber-700/40"
          />
          <KpiMini
            icon={Hash}
            label="Total convenios"
            value={String(stats.totalConvenios)}
            tone="text-sky-700 bg-sky-100/70 border-sky-200/70 dark:text-sky-400 dark:bg-sky-900/40 dark:border-sky-700/40"
          />
          <KpiMini
            icon={Trophy}
            label="Total registros"
            value={formatNumber(stats.totalCount)}
            tone="text-violet-700 bg-violet-100/70 border-violet-200/70 dark:text-violet-400 dark:bg-violet-900/40 dark:border-violet-700/40"
          />
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Top 10 convenios por valor repassado</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[380px] w-full rounded-lg" />
          ) : data && data.length > 0 ? (
            <RankingChart data={data} />
          ) : (
            <div className="flex h-[380px] items-center justify-center text-sm text-muted-foreground">
              Sem dados de repasse
            </div>
          )}
        </CardContent>
      </Card>

      {data && data.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Todos os convenios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Convenio</TableHead>
                    <TableHead className="text-right">Registros</TableHead>
                    <TableHead className="text-right">Valor bruto</TableHead>
                    <TableHead className="text-right">Glosa</TableHead>
                    <TableHead className="text-right">Repassado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, i) => (
                    <TableRow key={row.convenio}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="max-w-[200px] truncate font-medium">{row.convenio}</TableCell>
                      <TableCell className="text-right">{formatNumber(row.count)}</TableCell>
                      <TableCell className="text-right">{formatBRL(row.total_bruto)}</TableCell>
                      <TableCell className="text-right">{formatBRL(row.total_glosa)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatBRL(row.total_repassado)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
