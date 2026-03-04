'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Building2, GitCompare, Banknote, Upload, CheckCircle } from 'lucide-react';
import { formatBRL, formatNumber } from '@/lib/utils/formatting';
import { cn } from '@/lib/utils';

function useAdminOverview() {
  return useQuery({
    queryKey: ['admin-overview'],
    queryFn: async () => {
      const res = await fetch('/api/admin/overview');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json() as Promise<{
        totalDoctors: number;
        totalClinics: number;
        totalSessions: number;
        completedSessions: number;
        totalUploads: number;
        totalRevenue: number;
      }>;
    },
  });
}

const statCards = [
  { key: 'totalDoctors' as const, label: 'Medicos cadastrados', icon: Users, tone: 'text-sky-700 bg-sky-100/70 dark:text-sky-400 dark:bg-sky-900/40' },
  { key: 'totalClinics' as const, label: 'Clinicas', icon: Building2, tone: 'text-violet-700 bg-violet-100/70 dark:text-violet-400 dark:bg-violet-900/40' },
  { key: 'totalSessions' as const, label: 'Conferencias', icon: GitCompare, tone: 'text-emerald-700 bg-emerald-100/70 dark:text-emerald-400 dark:bg-emerald-900/40' },
  { key: 'completedSessions' as const, label: 'Conferencias concluidas', icon: CheckCircle, tone: 'text-teal-700 bg-teal-100/70 dark:text-teal-400 dark:bg-teal-900/40' },
  { key: 'totalUploads' as const, label: 'Uploads realizados', icon: Upload, tone: 'text-amber-700 bg-amber-100/70 dark:text-amber-400 dark:bg-amber-900/40' },
  { key: 'totalRevenue' as const, label: 'Receita total repassada', icon: Banknote, tone: 'text-emerald-700 bg-emerald-100/70 dark:text-emerald-400 dark:bg-emerald-900/40' },
];

export default function AdminOverviewPage() {
  const { data, isLoading } = useAdminOverview();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Visao geral do sistema</h2>
        <p className="text-sm text-muted-foreground">Metricas globais de todos os medicos e clinicas.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <Card key={card.key}>
            <CardContent className="flex items-center gap-3 p-4">
              <span className={cn('rounded-lg border p-2.5 shadow-sm', card.tone)}>
                <card.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                {isLoading ? (
                  <Skeleton className="mt-1 h-6 w-20" />
                ) : (
                  <p className="text-xl font-bold tracking-tight">
                    {card.key === 'totalRevenue'
                      ? formatBRL(data?.totalRevenue ?? 0)
                      : formatNumber(data?.[card.key] ?? 0)}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
