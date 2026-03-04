'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TABLES } from '@/lib/supabase/tables';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Clinic {
  id: string;
  name: string;
}

interface ClinicSelectorProps {
  value: string;
  onChange: (clinicId: string) => void;
  disabled?: boolean;
}

export function ClinicSelector({ value, onChange, disabled }: ClinicSelectorProps) {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from(TABLES.clinics)
      .select('id, name')
      .order('name')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setClinics(data);
        }
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger className="w-[240px]">
          <SelectValue placeholder="Carregando..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-[240px]">
        <SelectValue placeholder="Selecione a clínica" />
      </SelectTrigger>
      <SelectContent>
        {clinics.map((clinic) => (
          <SelectItem key={clinic.id} value={clinic.id}>
            {clinic.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
