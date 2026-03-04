'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/stores/app-store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  // Load persisted theme on mount
  useEffect(() => {
    const stored = localStorage.getItem('nog-theme') as 'light' | 'dark' | 'system' | null;
    if (stored) setTheme(stored);
  }, [setTheme]);

  // Apply dark class to <html>
  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const apply = () => root.classList.toggle('dark', mq.matches);
      apply();
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }

    root.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return <>{children}</>;
}
