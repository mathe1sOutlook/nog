'use client';

import { useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calculator, TrendingUp, Minus, Percent } from 'lucide-react';
import { ExportMenu } from '@/components/shared/export-menu';
import { useProjectionData } from '@/lib/hooks/use-projection-data';
import { useECharts } from '@/lib/hooks/use-echarts';
import { useEChartsTheme } from '@/lib/hooks/use-echarts-theme';
import { formatBRL } from '@/lib/utils/formatting';

function ProjectionChart({ data }: { data: ReturnType<typeof useProjectionData>['data'] }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const theme = useEChartsTheme();

  const option = useMemo(() => {
    if (!data) return {};

    const historical = data.historical;
    const projected = data.projected;
    const all = [
      ...historical.map((h) => ({ month: h.month, value: h.total_repassado, upper: null as number | null, lower: null as number | null, type: 'historical' })),
      ...projected.map((p) => ({ month: p.month, value: p.net_value, upper: p.net_upper, lower: p.net_lower, type: 'projected' })),
    ];

    const labels = all.map((d) => {
      const date = new Date(d.month);
      return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    });

    const historicalValues = all.map((d) => d.type === 'historical' ? d.value : null);
    const projectedValues = all.map((d, i) => {
      if (d.type === 'projected') return d.value;
      if (i === historical.length - 1) return d.value;
      return null;
    });
    const upperBand = all.map((d) => d.upper);
    const lowerBand = all.map((d) => d.lower);

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: theme.tooltipBg,
        borderColor: theme.tooltipBorder,
        textStyle: { color: theme.isDark ? '#e5e7eb' : '#1f2a37', fontSize: 12 },
      },
      legend: {
        bottom: 0,
        textStyle: { fontSize: 11, color: theme.textColor },
      },
      grid: { left: 70, right: 24, top: 20, bottom: 50 },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { color: theme.textColor, fontSize: 10 },
        axisLine: { lineStyle: { color: theme.splitLineColor } },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: theme.textColor,
          fontSize: 10,
          formatter: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v),
        },
        splitLine: { lineStyle: { color: theme.splitLineColor } },
      },
      series: [
        {
          name: 'Historico',
          type: 'line',
          data: historicalValues,
          color: '#10b981',
          smooth: true,
          lineStyle: { width: 2.5 },
          areaStyle: { opacity: 0.08 },
          symbolSize: 6,
        },
        {
          name: 'Projecao',
          type: 'line',
          data: projectedValues,
          color: '#8b5cf6',
          smooth: true,
          lineStyle: { width: 2, type: 'dashed' },
          symbolSize: 6,
        },
        {
          name: 'Banda superior',
          type: 'line',
          data: upperBand,
          color: 'transparent',
          lineStyle: { width: 0 },
          symbol: 'none',
          areaStyle: { color: 'rgba(139,92,246,0.08)' },
          stack: 'confidence',
        },
        {
          name: 'Banda inferior',
          type: 'line',
          data: lowerBand,
          color: 'transparent',
          lineStyle: { width: 0 },
          symbol: 'none',
          areaStyle: { color: 'rgba(139,92,246,0.08)' },
          stack: 'confidence',
        },
      ],
      animationDuration: 600,
    };
  }, [data, theme]);

  useECharts(chartRef, option);

  return <div ref={chartRef} className="h-[380px] w-full" />;
}

export default function ProjectionPage() {
  const { data, isLoading } = useProjectionData();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-primary">
            <Calculator className="h-5 w-5" />
            <h1 className="text-2xl font-bold tracking-tight">Projecao financeira</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Projecao de repasse liquido para os proximos 3 meses com base na media ponderada.
          </p>
        </div>
        <ExportMenu
          disabled={!data || data.projected.length === 0}
          onExportPDF={async () => {
            if (!data) return;
            const { exportPDF } = await import('@/lib/utils/export-pdf');
            exportPDF({
              title: 'Projecao Financeira',
              subtitle: `Taxa: ${data.taxRate.toFixed(1)}% | Deducoes: R$ ${data.deductions.toFixed(2)}`,
              headers: ['Mes', 'Bruto Projetado', 'Liquido', 'Banda Inferior', 'Banda Superior'],
              rows: data.projected.map((r: { month: string; projected_value: number; net_value: number; net_lower: number; net_upper: number }) => [
                new Date(r.month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
                r.projected_value, r.net_value, r.net_lower, r.net_upper,
              ]),
              filename: 'projecao-financeira',
            });
          }}
          onExportExcel={async () => {
            if (!data) return;
            const { exportExcel } = await import('@/lib/utils/export-excel');
            exportExcel({
              sheetName: 'Projecao',
              headers: ['Mes', 'Bruto Projetado', 'Liquido', 'Banda Inferior', 'Banda Superior'],
              rows: data.projected.map((r: { month: string; projected_value: number; net_value: number; net_lower: number; net_upper: number }) => [
                new Date(r.month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
                r.projected_value, r.net_value, r.net_lower, r.net_upper,
              ]),
              filename: 'projecao-financeira',
            });
          }}
        />
      </div>

      {!isLoading && data && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <span className="rounded-lg border bg-violet-100/70 p-2 shadow-sm dark:bg-violet-900/40">
                <TrendingUp className="h-4 w-4 text-violet-700 dark:text-violet-400" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">Projecao media</p>
                <p className="text-lg font-bold">{formatBRL(data.projected[0]?.net_value ?? 0)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <span className="rounded-lg border bg-amber-100/70 p-2 shadow-sm dark:bg-amber-900/40">
                <Minus className="h-4 w-4 text-amber-700 dark:text-amber-400" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">Deducoes fixas</p>
                <p className="text-lg font-bold">{formatBRL(data.deductions)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <span className="rounded-lg border bg-rose-100/70 p-2 shadow-sm dark:bg-rose-900/40">
                <Percent className="h-4 w-4 text-rose-700 dark:text-rose-400" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">Taxa de imposto</p>
                <p className="text-lg font-bold">{data.taxRate.toFixed(1)}%</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold">Historico e projecao</CardTitle>
            <Badge variant="secondary" className="text-[10px]">Banda ±15%</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[380px] w-full rounded-lg" />
          ) : data && (data.historical.length > 0 || data.projected.length > 0) ? (
            <ProjectionChart data={data} />
          ) : (
            <div className="flex h-[380px] items-center justify-center text-sm text-muted-foreground">
              Sem dados historicos para projetar
            </div>
          )}
        </CardContent>
      </Card>

      {data && data.projected.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Projecao detalhada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mes</TableHead>
                    <TableHead className="text-right">Valor bruto projetado</TableHead>
                    <TableHead className="text-right">Liquido (- deducoes - imposto)</TableHead>
                    <TableHead className="text-right">Banda inferior</TableHead>
                    <TableHead className="text-right">Banda superior</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.projected.map((row) => (
                    <TableRow key={row.month}>
                      <TableCell className="font-medium">
                        {new Date(row.month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-right">{formatBRL(row.projected_value)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatBRL(row.net_value)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatBRL(row.net_lower)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatBRL(row.net_upper)}</TableCell>
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
