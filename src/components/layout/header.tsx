'use client';

import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useAppStore } from '@/lib/stores/app-store';
import { Button } from '@/components/ui/button';

const pathLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/upload': 'Upload de Dados',
  '/conference': 'Sessões de Conferência',
  '/conference/new': 'Nova Conferência',
  '/convenios': 'Convênios',
  '/settings/tax-rules': 'Regras de Impostos',
  '/settings/repasse-rules': 'Regras de Repasse',
  '/settings/deductions': 'Deduções Mensais',
};

function getBreadcrumb(pathname: string): string {
  // Exact match
  if (pathLabels[pathname]) return pathLabels[pathname];
  // Conference session
  if (pathname.startsWith('/conference/') && pathname.includes('/divergences'))
    return 'Divergências';
  if (pathname.startsWith('/conference/') && pathname.includes('/production'))
    return 'Produção';
  if (pathname.startsWith('/conference/') && pathname.includes('/repasse'))
    return 'Repasse';
  if (pathname.startsWith('/conference/'))
    return 'Resultado da Conferência';
  return 'Nog';
}

export function Header() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useAppStore();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      {!sidebarOpen && (
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleSidebar}>
          <Menu className="h-4 w-4" />
        </Button>
      )}

      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium">{getBreadcrumb(pathname)}</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          Otorrino DF
        </span>
      </div>
    </header>
  );
}
