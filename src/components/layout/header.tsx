'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/stores/app-store';
import { Button } from '@/components/ui/button';

const pathLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/upload': 'Upload de dados',
  '/conference': 'Sessoes de conferencia',
  '/conference/new': 'Nova conferencia',
  '/convenios': 'Convenios',
  '/settings/tax-rules': 'Regras de impostos',
  '/settings/repasse-rules': 'Regras de repasse',
  '/settings/deductions': 'Deducoes mensais',
};

function getBreadcrumb(pathname: string): string {
  if (pathLabels[pathname]) return pathLabels[pathname];
  if (pathname.startsWith('/conference/') && pathname.includes('/divergences')) return 'Divergencias';
  if (pathname.startsWith('/conference/') && pathname.includes('/production')) return 'Producao';
  if (pathname.startsWith('/conference/') && pathname.includes('/repasse')) return 'Repasse';
  if (pathname.startsWith('/conference/')) return 'Resultado da conferencia';
  return 'Nog';
}

export function Header() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useAppStore();

  const today = useMemo(
    () =>
      new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date()),
    [],
  );

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center gap-3">
        <Button
          variant="outline"
          size="icon-sm"
          className={cn('shadow-sm', sidebarOpen && 'lg:hidden')}
          onClick={toggleSidebar}
        >
          <Menu className="h-4 w-4" />
        </Button>

        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Painel operacional
          </p>
          <h1 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">
            {getBreadcrumb(pathname)}
          </h1>
        </div>

        <div className="ml-auto flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
          <Activity className="h-3.5 w-3.5 text-emerald-500" />
          <span className="font-medium text-foreground/85">Otorrino DF</span>
          <span className="text-muted-foreground/70">{today}</span>
        </div>
      </div>
    </header>
  );
}
