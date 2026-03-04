'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Eye, UserX, UserCheck } from 'lucide-react';

interface Doctor {
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
    nog_clinics: { id: string; name: string; slug: string } | null;
  }>;
}

function useDoctors() {
  return useQuery({
    queryKey: ['admin-doctors'],
    queryFn: async () => {
      const res = await fetch('/api/admin/doctors');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json() as Promise<Doctor[]>;
    },
  });
}

function CreateDoctorDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: async (body: Record<string, string>) => {
      const res = await fetch('/api/admin/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to create');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
      setOpen(false);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    create.mutate({
      full_name: form.get('full_name') as string,
      email: form.get('email') as string,
      crm: form.get('crm') as string,
      specialty: form.get('specialty') as string,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Novo medico
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar medico</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome completo</Label>
            <Input id="full_name" name="full_name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email (Google)</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="crm">CRM</Label>
              <Input id="crm" name="crm" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialty">Especialidade</Label>
              <Input id="specialty" name="specialty" />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={create.isPending}>
            {create.isPending ? 'Cadastrando...' : 'Cadastrar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminDoctorsPage() {
  const { data: doctors, isLoading } = useDoctors();
  const queryClient = useQueryClient();

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const res = await fetch(`/api/admin/doctors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active }),
      });
      if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-doctors'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Medicos</h2>
          <p className="text-sm text-muted-foreground">Gerencie medicos cadastrados no sistema.</p>
        </div>
        <CreateDoctorDialog />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            {doctors ? `${doctors.length} medicos` : 'Carregando...'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>CRM</TableHead>
                    <TableHead>Clinicas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {doctors?.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.full_name}</TableCell>
                      <TableCell className="text-muted-foreground">{doc.email ?? '—'}</TableCell>
                      <TableCell>{doc.crm ?? '—'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {doc.nog_doctor_clinics
                            ?.filter((dc) => dc.active && dc.nog_clinics)
                            .map((dc) => (
                              <Badge key={dc.clinic_id} variant="secondary" className="text-[10px]">
                                {dc.nog_clinics!.name}
                              </Badge>
                            ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={doc.is_active ? 'default' : 'destructive'} className="text-[10px]">
                          {doc.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                        {doc.role === 'admin' && (
                          <Badge variant="outline" className="ml-1 text-[10px]">Admin</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button asChild variant="ghost" size="icon-sm">
                            <Link href={`/admin/doctors/${doc.id}`}>
                              <Eye className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => toggleActive.mutate({ id: doc.id, is_active: !doc.is_active })}
                          >
                            {doc.is_active
                              ? <UserX className="h-3.5 w-3.5 text-rose-500" />
                              : <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                            }
                          </Button>
                        </div>
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
