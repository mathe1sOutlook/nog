'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AuditEntry {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  actor: { id: string; full_name: string; email: string | null } | null;
}

interface AuditResponse {
  data: AuditEntry[];
  total: number;
  page: number;
  limit: number;
}

function useAuditLog(page: number) {
  return useQuery({
    queryKey: ['admin-activity', page],
    queryFn: async () => {
      const res = await fetch(`/api/admin/activity?page=${page}&limit=30`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json() as Promise<AuditResponse>;
    },
  });
}

const actionLabels: Record<string, string> = {
  conference_created: 'Criou conferencia',
  conference_completed: 'Concluiu conferencia',
  upload_production: 'Upload producao',
  upload_repasse: 'Upload repasse',
  doctor_created: 'Cadastrou medico',
  doctor_updated: 'Atualizou medico',
  clinic_created: 'Cadastrou clinica',
  clinic_updated: 'Atualizou clinica',
};

export default function AdminActivityPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAuditLog(page);

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Log de atividade</h2>
        <p className="text-sm text-muted-foreground">Registro de acoes realizadas no sistema.</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            {data ? `${data.total} registros` : 'Carregando...'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : data && data.data.length > 0 ? (
            <div className="space-y-2">
              {data.data.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {actionLabels[entry.action] ?? entry.action}
                      </Badge>
                      {entry.entity_type && (
                        <span className="text-[10px] text-muted-foreground">
                          {entry.entity_type}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm">
                      <span className="font-medium">{entry.actor?.full_name ?? 'Sistema'}</span>
                      {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                        <span className="text-muted-foreground">
                          {' — '}{JSON.stringify(entry.metadata).slice(0, 100)}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(entry.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>
              ))}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma atividade registrada.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
