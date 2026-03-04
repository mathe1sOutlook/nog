'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/stores/app-store';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/shared/theme-toggle';

const pathLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/upload': 'Upload de dados',
  '/conference': 'Sessoes de conferencia',
  '/conference/new': 'Nova conferencia',
  '/convenios': 'Convenios',
  '/settings/tax-rules': 'Regras de impostos',
  '/settings/repasse-rules': 'Regras de repasse',
  '/settings/deductions': 'Deducoes mensais',
  '/analytics/monthly': 'Evolucao mensal',
  '/analytics/convenios': 'Ranking de convenios',
  '/analytics/projection': 'Projecao financeira',
};

function getBreadcrumb(pathname: string): string {
  if (pathLabels[pathname]) return pathLabels[pathname];
  if (pathname.startsWith('/conference/') && pathname.includes('/divergences')) return 'Divergencias';
  if (pathname.startsWith('/conference/') && pathname.includes('/production')) return 'Producao';
  if (pathname.startsWith('/conference/') && pathname.includes('/repasse')) return 'Repasse';
  if (pathname.startsWith('/conference/')) return 'Resultado da conferencia';
  return 'Nog';
}

function UserAvatar({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={avatarUrl} alt="" className="h-7 w-7 rounded-full" />
    );
  }
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
      {initials}
    </span>
  );
}

export function Header() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const user = useAppStore((s) => s.user);

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

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:block">{today}</span>
          <ThemeToggle />
          {user && (
            <div className="flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-2 py-1 shadow-sm">
              <UserAvatar name={user.fullName} avatarUrl={user.avatarUrl} />
              <span className="hidden max-w-[120px] truncate text-xs font-medium text-foreground/85 sm:block">
                {user.fullName}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
