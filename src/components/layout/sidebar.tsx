'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Upload,
  GitCompare,
  Building2,
  Receipt,
  Percent,
  Minus,
  ChevronLeft,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/stores/app-store';
import { Button } from '@/components/ui/button';

const navGroups = [
  {
    label: 'Painel',
    items: [{ href: '/', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Conferencia',
    items: [
      { href: '/upload', label: 'Upload', icon: Upload },
      { href: '/conference', label: 'Sessoes', icon: GitCompare },
    ],
  },
  {
    label: 'Cadastros',
    items: [{ href: '/convenios', label: 'Convenios', icon: Building2 }],
  },
  {
    label: 'Configuracoes',
    items: [
      { href: '/settings/tax-rules', label: 'Impostos', icon: Receipt },
      { href: '/settings/repasse-rules', label: 'Regras de repasse', icon: Percent },
      { href: '/settings/deductions', label: 'Deducoes', icon: Minus },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useAppStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-dvh flex-col border-r border-sidebar-border/80 bg-sidebar/95 text-sidebar-foreground shadow-2xl shadow-slate-950/20 backdrop-blur-xl transition-[width,transform] duration-300 ease-out',
        sidebarOpen ? 'w-72 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0',
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/10 to-transparent" />

      <div className="relative flex h-16 items-center justify-between border-b border-sidebar-border/70 px-4">
        {sidebarOpen && (
          <Link href="/" className="leading-tight">
            <p className="text-lg font-semibold tracking-tight text-sidebar-foreground">Nog</p>
            <p className="text-[11px] uppercase tracking-[0.22em] text-sidebar-foreground/60">Conferencia</p>
          </Link>
        )}

        <Button
          variant="ghost"
          size="icon-sm"
          className="text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={toggleSidebar}
        >
          <ChevronLeft
            className={cn('h-4 w-4 transition-transform duration-300', !sidebarOpen && 'rotate-180')}
          />
        </Button>
      </div>

      <nav className="relative flex-1 space-y-5 overflow-y-auto px-3 py-5">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1.5">
            {sidebarOpen && (
              <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/45">
                {group.label}
              </p>
            )}

            {group.items.map((item) => {
              const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-slate-950/20'
                      : 'text-sidebar-foreground/72 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    !sidebarOpen && 'justify-center px-2',
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="relative border-t border-sidebar-border/70 p-3">
        {sidebarOpen ? (
          <div className="rounded-xl bg-white/5 p-3">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              <p className="text-xs font-medium text-sidebar-foreground/90">Dra. Luana Fontana</p>
            </div>
            <div className="mb-3 flex items-center gap-2 text-[11px] text-sidebar-foreground/55">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Otorrino DF</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                window.location.href = '/login';
              }}
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            className="mx-auto flex text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/login';
            }}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </aside>
  );
}
