import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/lib/stores/app-store';

export interface ProjectionData {
  historical: Array<{
    month: string;
    total_repassado: number;
    total_bruto: number;
    total_divergences: number;
  }>;
  projected: Array<{
    month: string;
    projected_value: number;
    upper_bound: number;
    lower_bound: number;
    net_value: number;
    net_upper: number;
    net_lower: number;
  }>;
  deductions: number;
  taxRate: number;
}

export function useProjectionData() {
  const clinicId = useAppStore((s) => s.activeClinicId);

  return useQuery({
    queryKey: ['projection', clinicId],
    queryFn: async () => {
      const params = clinicId ? `?clinic_id=${clinicId}` : '';
      const res = await fetch(`/api/analytics/projection${params}`);
      if (!res.ok) throw new Error('Failed to fetch projection data');
      return res.json() as Promise<ProjectionData>;
    },
    enabled: !!clinicId,
  });
}
