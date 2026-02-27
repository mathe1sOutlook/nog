'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Upload,
  GitCompare,
  Building2,
  Settings,
  Receipt,
  Percent,
  Minus,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/stores/app-store';
import { Button } from '@/components/ui/button';

const navGroups = [
  {
    label: 'Painel',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Conferência',
    items: [
      { href: '/upload', label: 'Upload', icon: Upload },
      { href: '/conference', label: 'Sessões', icon: GitCompare },
    ],
  },
  {
    label: 'Cadastros',
    items: [
      { href: '/convenios', label: 'Convênios', icon: Building2 },
    ],
  },
  {
    label: 'Configurações',
    items: [
      { href: '/settings/tax-rules', label: 'Impostos', icon: Receipt },
      { href: '/settings/repasse-rules', label: 'Regras de Repasse', icon: Percent },
      { href: '/settings/deductions', label: 'Deduções', icon: Minus },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useAppStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-card transition-all duration-200',
        sidebarOpen ? 'w-60' : 'w-16',
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        {sidebarOpen && (
          <Link href="/" className="text-lg font-bold tracking-tight">
            Nog
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={toggleSidebar}
        >
          <ChevronLeft
            className={cn(
              'h-4 w-4 transition-transform',
              !sidebarOpen && 'rotate-180',
            )}
          />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            {sidebarOpen && (
              <p className="mb-1 px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-accent font-medium text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                    !sidebarOpen && 'justify-center px-2',
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      {sidebarOpen && (
        <div className="border-t p-4">
          <p className="text-xs text-muted-foreground">Dra. Luana Fontana</p>
          <p className="text-xs text-muted-foreground">Otorrino DF</p>
        </div>
      )}
    </aside>
  );
}
