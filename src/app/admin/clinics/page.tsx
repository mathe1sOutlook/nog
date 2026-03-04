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
import { Plus, Eye } from 'lucide-react';

interface Clinic {
  id: string;
  name: string;
  slug: string;
  igut_subdomain: string | null;
  address: string | null;
  created_at: string;
  nog_doctor_clinics: Array<{
    doctor_id: string;
    active: boolean;
    nog_doctors: { id: string; full_name: string; email: string | null; is_active: boolean } | null;
  }>;
}

function useClinics() {
  return useQuery({
    queryKey: ['admin-clinics'],
    queryFn: async () => {
      const res = await fetch('/api/admin/clinics');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json() as Promise<Clinic[]>;
    },
  });
}

function CreateClinicDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: async (body: Record<string, string>) => {
      const res = await fetch('/api/admin/clinics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to create');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clinics'] });
      setOpen(false);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = form.get('name') as string;
    create.mutate({
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      igut_subdomain: form.get('igut_subdomain') as string,
      address: form.get('address') as string,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Nova clinica
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar clinica</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da clinica</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="igut_subdomain">Subdominio iGut (opcional)</Label>
            <Input id="igut_subdomain" name="igut_subdomain" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Endereco (opcional)</Label>
            <Input id="address" name="address" />
          </div>
          <Button type="submit" className="w-full" disabled={create.isPending}>
            {create.isPending ? 'Cadastrando...' : 'Cadastrar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminClinicsPage() {
  const { data: clinics, isLoading } = useClinics();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Clinicas</h2>
          <p className="text-sm text-muted-foreground">Gerencie clinicas cadastradas no sistema.</p>
        </div>
        <CreateClinicDialog />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            {clinics ? `${clinics.length} clinicas` : 'Carregando...'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>iGut</TableHead>
                    <TableHead>Medicos ativos</TableHead>
                    <TableHead className="text-right">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clinics?.map((clinic) => {
                    const activeDoctors = clinic.nog_doctor_clinics
                      ?.filter((dc) => dc.active && dc.nog_doctors?.is_active) ?? [];
                    return (
                      <TableRow key={clinic.id}>
                        <TableCell className="font-medium">{clinic.name}</TableCell>
                        <TableCell className="text-muted-foreground">{clinic.slug}</TableCell>
                        <TableCell>
                          {clinic.igut_subdomain
                            ? <Badge variant="secondary" className="text-[10px]">{clinic.igut_subdomain}</Badge>
                            : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {activeDoctors.map((dc) => (
                              <Badge key={dc.doctor_id} variant="outline" className="text-[10px]">
                                {dc.nog_doctors!.full_name.split(' ')[0]}
                              </Badge>
                            ))}
                            {activeDoctors.length === 0 && <span className="text-xs text-muted-foreground">Nenhum</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="ghost" size="icon-sm">
                            <Link href={`/admin/clinics/${clinic.id}`}>
                              <Eye className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
