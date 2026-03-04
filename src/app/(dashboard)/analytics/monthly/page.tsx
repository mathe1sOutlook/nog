'use client';

import { useRef, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp } from 'lucide-react';
import { useMonthlyData } from '@/lib/hooks/use-monthly-data';
import { useECharts } from '@/lib/hooks/use-echarts';
import { useEChartsTheme } from '@/lib/hooks/use-echarts-theme';
import { formatBRL, formatNumber, formatPercent } from '@/lib/utils/formatting';

const PERIOD_OPTIONS = [
  { label: '6 meses', value: 6 },
  { label: '12 meses', value: 12 },
  { label: '24 meses', value: 24 },
];

function MonthlyChart({ data }: { data: Array<{ month: string; total_bruto: number; total_repassado: number; total_divergences: number; match_rate: number }> }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const theme = useEChartsTheme();

  const option = useMemo(() => {
    const months = data.map((d) => {
      const date = new Date(d.month);
      return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    });

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
      grid: { left: 70, right: 60, top: 20, bottom: 50 },
      xAxis: {
        type: 'category',
        data: months,
        axisLabel: { color: theme.textColor, fontSize: 10 },
        axisLine: { lineStyle: { color: theme.splitLineColor } },
      },
      yAxis: [
        {
          type: 'value',
          name: 'R$',
          nameTextStyle: { color: theme.textColor, fontSize: 10 },
          axisLabel: {
            color: theme.textColor,
            fontSize: 10,
            formatter: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v),
          },
          splitLine: { lineStyle: { color: theme.splitLineColor } },
        },
        {
          type: 'value',
          name: 'Qtd',
          nameTextStyle: { color: theme.textColor, fontSize: 10 },
          axisLabel: { color: theme.textColor, fontSize: 10 },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: 'Valor bruto',
          type: 'bar',
          data: data.map((d) => Number(d.total_bruto) || 0),
          color: '#94a3b8',
          barMaxWidth: 24,
          itemStyle: { borderRadius: [4, 4, 0, 0] },
        },
        {
          name: 'Repassado',
          type: 'line',
          data: data.map((d) => Number(d.total_repassado) || 0),
          color: '#10b981',
          smooth: true,
          areaStyle: { opacity: 0.1 },
          lineStyle: { width: 2 },
        },
        {
          name: 'Divergencias',
          type: 'bar',
          yAxisIndex: 1,
          data: data.map((d) => Number(d.total_divergences) || 0),
          color: '#f43f5e',
          barMaxWidth: 16,
          itemStyle: { borderRadius: [4, 4, 0, 0] },
        },
      ],
      animationDuration: 600,
    };
  }, [data, theme]);

  useECharts(chartRef, option);

  return <div ref={chartRef} className="h-[350px] w-full" />;
}

export default function MonthlyAnalyticsPage() {
  const [months, setMonths] = useState(12);
  const { data, isLoading } = useMonthlyData(months);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-primary">
            <TrendingUp className="h-5 w-5" />
            <h1 className="text-2xl font-bold tracking-tight">Evolucao mensal</h1>
          </div>
          <p className="text-sm text-muted-foreground">Acompanhe producao, repasse e divergencias ao longo do tempo.</p>
        </div>
        <div className="flex gap-1">
          {PERIOD_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={months === opt.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMonths(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Valor bruto vs. repassado vs. divergencias</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[350px] w-full rounded-lg" />
          ) : data && data.length > 0 ? (
            <MonthlyChart data={data} />
          ) : (
            <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground">
              Sem dados para o periodo selecionado
            </div>
          )}
        </CardContent>
      </Card>

      {data && data.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Detalhamento mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mes</TableHead>
                    <TableHead className="text-right">Producao</TableHead>
                    <TableHead className="text-right">Valor bruto</TableHead>
                    <TableHead className="text-right">Repassado</TableHead>
                    <TableHead className="text-right">Divergencias</TableHead>
                    <TableHead className="text-right">Match rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row: { month: string; total_production: number; total_bruto: number; total_repassado: number; total_divergences: number; match_rate: number }) => (
                    <TableRow key={row.month}>
                      <TableCell className="font-medium">
                        {new Date(row.month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(row.total_production)}</TableCell>
                      <TableCell className="text-right">{formatBRL(Number(row.total_bruto))}</TableCell>
                      <TableCell className="text-right">{formatBRL(Number(row.total_repassado))}</TableCell>
                      <TableCell className="text-right">{formatNumber(row.total_divergences)}</TableCell>
                      <TableCell className="text-right">{formatPercent(Number(row.match_rate))}</TableCell>
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
