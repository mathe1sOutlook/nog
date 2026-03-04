'use client';

import { useEffect, type RefObject } from 'react';

type EChartsModule = typeof import('echarts');
let echartsModule: EChartsModule | null = null;

export function useECharts(
  containerRef: RefObject<HTMLDivElement | null>,
  option: Record<string, unknown>,
) {
  useEffect(() => {
    let chart: ReturnType<EChartsModule['init']> | null = null;
    let ro: ResizeObserver | null = null;

    async function initChart() {
      if (!containerRef.current) return;
      if (!echartsModule) echartsModule = await import('echarts');

      chart = echartsModule.init(containerRef.current);
      chart.setOption(option);

      ro = new ResizeObserver(() => chart?.resize());
      ro.observe(containerRef.current);
    }

    initChart();
    return () => {
      ro?.disconnect();
      chart?.dispose();
    };
  }, [containerRef, option]);
}
