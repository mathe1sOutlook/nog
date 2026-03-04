'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatNumber } from '@/lib/utils/formatting';

interface UploadItem {
  id: string;
  file_type: string;
  file_name: string;
  status: string;
  records_parsed: number | null;
  records_imported: number | null;
  created_at: string;
  doctor: { full_name: string } | null;
  clinic: { name: string } | null;
}

function useAllUploads() {
  return useQuery({
    queryKey: ['admin-uploads'],
    queryFn: async () => {
      const res = await fetch('/api/admin/uploads');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json() as Promise<UploadItem[]>;
    },
  });
}

const statusColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
  completed: 'default',
  processing: 'secondary',
  pending: 'secondary',
  failed: 'destructive',
};

export default function AdminUploadsPage() {
  const { data: uploads, isLoading } = useAllUploads();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Todos os uploads</h2>
        <p className="text-sm text-muted-foreground">Historico de uploads de todos os medicos.</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            {uploads ? `${uploads.length} uploads` : 'Carregando...'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : uploads && uploads.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Arquivo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Medico</TableHead>
                    <TableHead>Clinica</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Registros</TableHead>
                    <TableHead className="text-right">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploads.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="max-w-[180px] truncate font-medium">{u.file_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{u.file_type}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{u.doctor?.full_name ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{u.clinic?.name ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant={statusColors[u.status] ?? 'secondary'} className="text-[10px]">
                          {u.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(u.records_imported ?? 0)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhum upload encontrado.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
