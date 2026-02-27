'use client';

import { useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DIVERGENCE_TYPE_LABELS, DIVERGENCE_TYPE_COLORS } from '@/lib/utils/constants';
import type { DivergenceType } from '@/lib/types/database';

// Dynamic import for ECharts to avoid SSR issues
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

// --- Divergence by Type (Donut) ---

interface DivergenceByTypeData {
  type: DivergenceType;
  count: number;
}

interface DivergenceByTypeChartProps {
  data: DivergenceByTypeData[];
}

export function DivergenceByTypeChart({ data }: DivergenceByTypeChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const option = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, left: 'center', textStyle: { fontSize: 11 } },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        label: { show: false },
        data: data.map((d) => ({
          name: DIVERGENCE_TYPE_LABELS[d.type],
          value: d.count,
          itemStyle: { color: DIVERGENCE_TYPE_COLORS[d.type] },
        })),
      },
    ],
  };

  useECharts(chartRef, option);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Divergências por Tipo</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={chartRef} className="h-[280px] w-full" />
      </CardContent>
    </Card>
  );
}

// --- Divergence by Convênio (Horizontal Bar) ---

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

  // Sort by total descending and take top 10
  const sorted = [...data]
    .sort((a, b) => (b.alta + b.media + b.baixa) - (a.alta + a.media + a.baixa))
    .slice(0, 10);

  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { bottom: 0, textStyle: { fontSize: 11 } },
    grid: { left: 140, right: 20, top: 10, bottom: 40 },
    yAxis: {
      type: 'category',
      data: sorted.map((d) => d.convenio).reverse(),
      axisLabel: { fontSize: 10, width: 120, overflow: 'truncate' },
    },
    xAxis: { type: 'value' },
    series: [
      { name: 'Alta', type: 'bar', stack: 'total', data: sorted.map((d) => d.alta).reverse(), color: '#ef4444' },
      { name: 'Média', type: 'bar', stack: 'total', data: sorted.map((d) => d.media).reverse(), color: '#f59e0b' },
      { name: 'Baixa', type: 'bar', stack: 'total', data: sorted.map((d) => d.baixa).reverse(), color: '#94a3b8' },
    ],
  };

  useECharts(chartRef, option);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Top 10 Convênios com Divergências</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={chartRef} className="h-[280px] w-full" />
      </CardContent>
    </Card>
  );
}
