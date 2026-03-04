'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  Upload,
  Activity,
  ChevronLeft,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SessionHydrator } from '@/components/shared/session-hydrator';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { useAppStore } from '@/lib/stores/app-store';

const adminNav = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/doctors', label: 'Medicos', icon: Users },
  { href: '/admin/clinics', label: 'Clinicas', icon: Building2 },
  { href: '/admin/uploads', label: 'Uploads', icon: Upload },
  { href: '/admin/activity', label: 'Atividade', icon: Activity },
];

function AdminSidebar() {
  const pathname = usePathname();
  const [sidebarOpen, toggleSidebar] = useAppStore((s) => [s.sidebarOpen, s.toggleSidebar]);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-dvh flex-col border-r border-sidebar-border/80 bg-sidebar/95 text-sidebar-foreground shadow-2xl shadow-slate-950/20 backdrop-blur-xl transition-[width,transform] duration-300 ease-out',
        sidebarOpen ? 'w-64 translate-x-0' : 'w-16 -translate-x-full lg:translate-x-0',
      )}
    >
      <div className="relative flex h-16 items-center justify-between border-b border-sidebar-border/70 px-4">
        {sidebarOpen && (
          <div className="leading-tight">
            <p className="text-lg font-semibold tracking-tight text-sidebar-foreground">Nog</p>
            <p className="text-[10px] uppercase tracking-[0.22em] text-amber-400/80">Admin</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={toggleSidebar}
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform duration-300', !sidebarOpen && 'rotate-180')} />
        </Button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {adminNav.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200',
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
      </nav>

      <div className="border-t border-sidebar-border/70 p-3">
        <Link
          href="/"
          className={cn(
            'flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            !sidebarOpen && 'justify-center px-2',
          )}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          {sidebarOpen && <span>Voltar ao painel</span>}
        </Link>
      </div>
    </aside>
  );
}

const pathLabels: Record<string, string> = {
  '/admin': 'Overview',
  '/admin/doctors': 'Medicos',
  '/admin/clinics': 'Clinicas',
  '/admin/uploads': 'Uploads',
  '/admin/activity': 'Log de atividade',
};

function AdminHeader() {
  const pathname = usePathname();
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const user = useAppStore((s) => s.user);

  const label = pathLabels[pathname]
    ?? (pathname.startsWith('/admin/doctors/') ? 'Detalhe do medico'
    : pathname.startsWith('/admin/clinics/') ? 'Detalhe da clinica'
    : 'Admin');

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 px-4 backdrop-blur-xl sm:px-6">
      <div className="flex h-14 items-center gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400">
            Painel administrativo
          </p>
          <h1 className="truncate text-base font-semibold tracking-tight text-foreground">{label}</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {user && (
            <span className="text-xs text-muted-foreground">{user.fullName}</span>
          )}
        </div>
      </div>
    </header>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);

  return (
    <>
      <SessionHydrator />
      <AdminSidebar />
      <div className={cn('min-h-dvh transition-[margin] duration-300', sidebarOpen ? 'lg:ml-64' : 'lg:ml-16')}>
        <AdminHeader />
        <main className="mx-auto max-w-[1200px] p-4 sm:p-6">
          {children}
        </main>
      </div>
    </>
  );
}
