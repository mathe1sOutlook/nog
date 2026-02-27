'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { useAppStore } from '@/lib/stores/app-store';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);

  return (
    <div className="page-shell min-h-screen">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Fechar menu lateral"
          className="fixed inset-0 z-30 bg-slate-950/35 backdrop-blur-[1px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar />

      <div
        className={cn(
          'relative min-h-screen transition-all duration-300',
          sidebarOpen ? 'ml-0 lg:ml-72' : 'ml-0 lg:ml-20',
        )}
      >
        <Header />
        <main className="px-4 pb-8 pt-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1400px] animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
