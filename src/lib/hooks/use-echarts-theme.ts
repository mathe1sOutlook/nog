'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { useAppStore } from '@/lib/stores/app-store';

function useIsDark() {
  const theme = useAppStore((s) => s.theme);

  const systemDark = useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
    () => false,
  );

  return theme === 'system' ? systemDark : theme === 'dark';
}

export function useEChartsTheme() {
  const isDark = useIsDark();

  return useMemo(
    () => ({
      isDark,
      textColor: isDark ? 'rgba(255,255,255,0.65)' : '#5f6b7e',
      borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.92)',
      splitLineColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(148,163,184,0.2)',
      tooltipBg: isDark ? 'rgba(30,30,40,0.95)' : '#fff',
      tooltipBorder: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb',
      emphasisColor: isDark ? '#e5e7eb' : '#1f2a37',
    }),
    [isDark],
  );
}
