'use client';

import { useRef, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DIVERGENCE_TYPE_LABELS, DIVERGENCE_TYPE_COLORS } from '@/lib/utils/constants';
import type { DivergenceType } from '@/lib/types/database';

type EChartsModule = typeof import('echarts');
let echartsModule: EChartsModule | null = null;

function useECharts(
  containerRef: React.RefObject<HTMLDivElement | null>,
  option: Record<string, unknown>,
) {
  useEffect(() => {
    let chart: ReturnType<EChartsModule['init']> | null = null;

    async function initChart() {
      if (!containerRef.current) return;
      if (!echartsModule) {
        echartsModule = await import('echarts');
      }

      chart = echartsModule.init(containerRef.current);
      chart.setOption(option);

      const handleResize = () => chart?.resize();
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        chart?.dispose();
      };
    }

    const cleanup = initChart();
    return () => {
      cleanup.then((fn) => fn?.());
    };
  }, [containerRef, option]);
}

interface DivergenceByTypeData {
  type: DivergenceType;
  count: number;
}

interface DivergenceByTypeChartProps {
  data: DivergenceByTypeData[];
}

export function DivergenceByTypeChart({ data }: DivergenceByTypeChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const option = useMemo(
    () => ({
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: {
        bottom: 0,
        left: 'center',
        textStyle: { fontSize: 11, color: '#5f6b7e' },
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
            borderColor: 'rgba(255,255,255,0.92)',
            borderWidth: 2,
          },
          emphasis: {
            label: {
              show: true,
              fontWeight: 600,
              color: '#1f2a37',
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
    [data],
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

  const sorted = useMemo(
    () =>
      [...data]
        .sort((a, b) => b.alta + b.media + b.baixa - (a.alta + a.media + a.baixa))
        .slice(0, 10),
    [data],
  );

  const option = useMemo(
    () => ({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: {
        bottom: 0,
        itemHeight: 8,
        itemWidth: 16,
        textStyle: { fontSize: 11, color: '#5f6b7e' },
      },
      grid: { left: 136, right: 18, top: 14, bottom: 42 },
      yAxis: {
        type: 'category',
        data: sorted.map((d) => d.convenio).reverse(),
        axisLabel: {
          fontSize: 10,
          width: 115,
          overflow: 'truncate',
          color: '#5f6b7e',
        },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      xAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.2)' } },
        axisLabel: { color: '#748091', fontSize: 10 },
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
    [sorted],
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
