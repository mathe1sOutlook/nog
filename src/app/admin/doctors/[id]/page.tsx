'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Mail, Stethoscope, Building2, Eye } from 'lucide-react';
import { formatBRL, formatNumber } from '@/lib/utils/formatting';

interface DoctorDetail {
  id: string;
  full_name: string;
  email: string | null;
  crm: string | null;
  specialty: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  nog_doctor_clinics: Array<{
    clinic_id: string;
    active: boolean;
    joined_at: string | null;
    nog_clinics: { id: string; name: string; slug: string } | null;
  }>;
  sessions: Array<{
    id: string;
    name: string | null;
    status: string;
    created_at: string;
    completed_at: string | null;
    total_matched: number | null;
    total_divergences: number | null;
    total_valor_repassado: number | null;
  }>;
  uploads: Array<{
    id: string;
    file_type: string;
    file_name: string;
    status: string;
    records_imported: number | null;
    created_at: string;
  }>;
}

function useDoctorDetail(id: string) {
  return useQuery({
    queryKey: ['admin-doctor', id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/doctors/${id}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json() as Promise<DoctorDetail>;
    },
  });
}

export default function AdminDoctorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: doctor, isLoading } = useDoctorDetail(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (!doctor) {
    return <p className="py-12 text-center text-muted-foreground">Medico nao encontrado.</p>;
  }

  const activeClinics = doctor.nog_doctor_clinics?.filter((dc) => dc.active && dc.nog_clinics) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon-sm">
          <Link href="/admin/doctors"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h2 className="text-xl font-bold tracking-tight">{doctor.full_name}</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {doctor.email && <><Mail className="h-3.5 w-3.5" /> {doctor.email}</>}
            {doctor.crm && <><span>·</span><Stethoscope className="h-3.5 w-3.5" /> CRM {doctor.crm}</>}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant={doctor.is_active ? 'default' : 'destructive'}>
            {doctor.is_active ? 'Ativo' : 'Inativo'}
          </Badge>
          {doctor.role === 'admin' && <Badge variant="outline">Admin</Badge>}
          {doctor.is_active && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await fetch('/api/admin/impersonate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ doctor_id: doctor.id }),
                });
                window.location.href = '/';
              }}
            >
              <Eye className="mr-2 h-3.5 w-3.5" />
              Ver como medico
            </Button>
          )}
        </div>
      </div>

      {/* Clinics */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Building2 className="h-4 w-4" /> Clinicas vinculadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeClinics.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">Nenhuma clinica vinculada</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {activeClinics.map((dc) => (
                <Link
                  key={dc.clinic_id}
                  href={`/admin/clinics/${dc.clinic_id}`}
                  className="rounded-lg border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-muted/50"
                >
                  {dc.nog_clinics!.name}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sessions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Ultimas conferencias</CardTitle>
        </CardHeader>
        <CardContent>
          {doctor.sessions.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">Nenhuma conferencia</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Matches</TableHead>
                    <TableHead className="text-right">Divergencias</TableHead>
                    <TableHead className="text-right">Repassado</TableHead>
                    <TableHead className="text-right">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {doctor.sessions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name ?? '—'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={s.status === 'completed' ? 'default' : s.status === 'failed' ? 'destructive' : 'secondary'}
                          className="text-[10px]"
                        >
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(s.total_matched ?? 0)}</TableCell>
                      <TableCell className="text-right">{formatNumber(s.total_divergences ?? 0)}</TableCell>
                      <TableCell className="text-right">{formatBRL(Number(s.total_valor_repassado) || 0)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {new Date(s.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Uploads */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Ultimos uploads</CardTitle>
        </CardHeader>
        <CardContent>
          {doctor.uploads.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">Nenhum upload</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Arquivo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Registros</TableHead>
                    <TableHead className="text-right">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {doctor.uploads.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="max-w-[200px] truncate font-medium">{u.file_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{u.file_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={u.status === 'completed' ? 'default' : u.status === 'failed' ? 'destructive' : 'secondary'}
                          className="text-[10px]"
                        >
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
