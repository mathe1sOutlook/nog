import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/lib/stores/app-store';

export function useMonthlyData(months = 12) {
  const clinicId = useAppStore((s) => s.activeClinicId);

  return useQuery({
    queryKey: ['monthly-analytics', clinicId, months],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (clinicId) params.set('clinic_id', clinicId);
      params.set('months', String(months));
      const res = await fetch(`/api/analytics/monthly?${params}`);
      if (!res.ok) throw new Error('Failed to fetch monthly data');
      return res.json() as Promise<Array<{
        month: string;
        total_production: number;
        total_bruto: number;
        total_repassado: number;
        total_divergences: number;
        total_valor_divergente: number;
        total_matched: number;
        match_rate: number;
      }>>;
    },
    enabled: !!clinicId,
  });
}
