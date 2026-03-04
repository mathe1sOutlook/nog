'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Users, Receipt, Percent, Minus } from 'lucide-react';
import { formatBRL } from '@/lib/utils/formatting';

interface ClinicDetail {
  id: string;
  name: string;
  slug: string;
  igut_subdomain: string | null;
  address: string | null;
  created_at: string;
  nog_doctor_clinics: Array<{
    doctor_id: string;
    active: boolean;
    joined_at: string | null;
    nog_doctors: { id: string; full_name: string; email: string | null; is_active: boolean; specialty: string | null } | null;
  }>;
  taxConfigs: Array<{
    id: string;
    doctor_id: string | null;
    procedure_category: string;
    tax_rate: number;
    description: string | null;
    effective_from: string;
    effective_to: string | null;
  }>;
  repasseRules: Array<{
    id: string;
    convenio_id: string | null;
    category_id: string | null;
    repasse_pct: number;
    effective_from: string;
    effective_to: string | null;
    notes: string | null;
  }>;
  deductions: Array<{
    id: string;
    doctor_id: string;
    deduction_type: string;
    amount: number;
    effective_from: string;
    effective_to: string | null;
  }>;
}

function useClinicDetail(id: string) {
  return useQuery({
    queryKey: ['admin-clinic', id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/clinics/${id}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json() as Promise<ClinicDetail>;
    },
  });
}

export default function AdminClinicDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: clinic, isLoading } = useClinicDetail(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (!clinic) {
    return <p className="py-12 text-center text-muted-foreground">Clinica nao encontrada.</p>;
  }

  const activeDoctors = clinic.nog_doctor_clinics?.filter((dc) => dc.active && dc.nog_doctors) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon-sm">
          <Link href="/admin/clinics"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h2 className="text-xl font-bold tracking-tight">{clinic.name}</h2>
          <p className="text-sm text-muted-foreground">
            {clinic.slug}
            {clinic.igut_subdomain && <> · iGut: {clinic.igut_subdomain}</>}
          </p>
        </div>
      </div>

      {/* Doctors */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Users className="h-4 w-4" /> Medicos vinculados ({activeDoctors.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeDoctors.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">Nenhum medico vinculado</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Especialidade</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeDoctors.map((dc) => (
                    <TableRow key={dc.doctor_id}>
                      <TableCell>
                        <Link href={`/admin/doctors/${dc.doctor_id}`} className="font-medium hover:underline">
                          {dc.nog_doctors!.full_name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{dc.nog_doctors!.email ?? '—'}</TableCell>
                      <TableCell>{dc.nog_doctors!.specialty ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant={dc.nog_doctors!.is_active ? 'default' : 'destructive'} className="text-[10px]">
                          {dc.nog_doctors!.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tax Configs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Receipt className="h-4 w-4" /> Configuracoes de imposto ({clinic.taxConfigs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clinic.taxConfigs.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">Sem regras de imposto</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Taxa</TableHead>
                    <TableHead>Descricao</TableHead>
                    <TableHead>Vigencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clinic.taxConfigs.map((tc) => (
                    <TableRow key={tc.id}>
                      <TableCell className="font-medium">{tc.procedure_category}</TableCell>
                      <TableCell className="text-right">{(Number(tc.tax_rate) * 100).toFixed(2)}%</TableCell>
                      <TableCell className="text-muted-foreground">{tc.description ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(tc.effective_from).toLocaleDateString('pt-BR')}
                        {tc.effective_to && ` — ${new Date(tc.effective_to).toLocaleDateString('pt-BR')}`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Repasse Rules */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Percent className="h-4 w-4" /> Regras de repasse ({clinic.repasseRules.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clinic.repasseRules.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">Sem regras de repasse</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">Percentual</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead>Vigencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clinic.repasseRules.map((rr) => (
                    <TableRow key={rr.id}>
                      <TableCell className="text-right font-semibold">{Number(rr.repasse_pct).toFixed(1)}%</TableCell>
                      <TableCell className="text-muted-foreground">{rr.notes ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(rr.effective_from).toLocaleDateString('pt-BR')}
                        {rr.effective_to && ` — ${new Date(rr.effective_to).toLocaleDateString('pt-BR')}`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Deductions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Minus className="h-4 w-4" /> Deducoes mensais ({clinic.deductions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clinic.deductions.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">Sem deducoes</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Vigencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clinic.deductions.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.deduction_type.replace(/_/g, ' ')}</TableCell>
                      <TableCell className="text-right">{formatBRL(Number(d.amount))}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(d.effective_from).toLocaleDateString('pt-BR')}
                        {d.effective_to && ` — ${new Date(d.effective_to).toLocaleDateString('pt-BR')}`}
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
