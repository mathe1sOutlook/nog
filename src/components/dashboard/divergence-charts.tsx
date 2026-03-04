'use client';

import { useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DIVERGENCE_TYPE_LABELS, DIVERGENCE_TYPE_COLORS } from '@/lib/utils/constants';
import { useECharts } from '@/lib/hooks/use-echarts';
import { useEChartsTheme } from '@/lib/hooks/use-echarts-theme';
import type { DivergenceType } from '@/lib/types/database';

interface DivergenceByTypeData {
  type: DivergenceType;
  count: number;
}

interface DivergenceByTypeChartProps {
  data: DivergenceByTypeData[];
}

export function DivergenceByTypeChart({ data }: DivergenceByTypeChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const theme = useEChartsTheme();

  const option = useMemo(
    () => ({
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
        backgroundColor: theme.tooltipBg,
        borderColor: theme.tooltipBorder,
        textStyle: { color: theme.isDark ? '#e5e7eb' : '#1f2a37' },
      },
      legend: {
        bottom: 0,
        left: 'center',
        textStyle: { fontSize: 11, color: theme.textColor },
      },
      series: [
        {
          type: 'pie',
          radius: ['44%', '72%'],
          center: ['50%', '45%'],
          padAngle: 2,
          avoidLabelOverlap: true,
          label: { show: false },
          itemStyle: {
            borderColor: theme.borderColor,
            borderWidth: 2,
          },
          emphasis: {
            label: {
              show: true,
              fontWeight: 600,
              color: theme.emphasisColor,
              formatter: '{b}\n{c}',
            },
          },
          data: data.map((d) => ({
            name: DIVERGENCE_TYPE_LABELS[d.type],
            value: d.count,
            itemStyle: { color: DIVERGENCE_TYPE_COLORS[d.type] },
          })),
        },
      ],
    }),
    [data, theme],
  );

  useECharts(chartRef, option);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Divergencias por tipo</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={chartRef} className="h-[300px] w-full" />
      </CardContent>
    </Card>
  );
}

interface ConvenioBarData {
  convenio: string;
  alta: number;
  media: number;
  baixa: number;
}

interface DivergenceByConvenioChartProps {
  data: ConvenioBarData[];
}

export function DivergenceByConvenioChart({ data }: DivergenceByConvenioChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const theme = useEChartsTheme();

  const sorted = useMemo(
    () =>
      [...data]
        .sort((a, b) => b.alta + b.media + b.baixa - (a.alta + a.media + a.baixa))
        .slice(0, 10),
    [data],
  );

  const option = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: theme.tooltipBg,
        borderColor: theme.tooltipBorder,
        textStyle: { color: theme.isDark ? '#e5e7eb' : '#1f2a37' },
      },
      legend: {
        bottom: 0,
        itemHeight: 8,
        itemWidth: 16,
        textStyle: { fontSize: 11, color: theme.textColor },
      },
      grid: { left: 136, right: 18, top: 14, bottom: 42 },
      yAxis: {
        type: 'category',
        data: sorted.map((d) => d.convenio).reverse(),
        axisLabel: {
          fontSize: 10,
          width: 115,
          overflow: 'truncate',
          color: theme.textColor,
        },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      xAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: theme.splitLineColor } },
        axisLabel: { color: theme.textColor, fontSize: 10 },
      },
      series: [
        {
          name: 'Alta',
          type: 'bar',
          stack: 'total',
          barMaxWidth: 18,
          data: sorted.map((d) => d.alta).reverse(),
          color: '#ef4444',
          itemStyle: { borderRadius: [0, 4, 4, 0] },
        },
        {
          name: 'Media',
          type: 'bar',
          stack: 'total',
          barMaxWidth: 18,
          data: sorted.map((d) => d.media).reverse(),
          color: '#f59e0b',
        },
        {
          name: 'Baixa',
          type: 'bar',
          stack: 'total',
          barMaxWidth: 18,
          data: sorted.map((d) => d.baixa).reverse(),
          color: '#94a3b8',
          itemStyle: { borderRadius: [0, 4, 4, 0] },
        },
      ],
      animationDuration: 700,
    }),
    [sorted, theme],
  );

  useECharts(chartRef, option);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Top 10 convenios com divergencias</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={chartRef} className="h-[300px] w-full" />
      </CardContent>
    </Card>
  );
}
