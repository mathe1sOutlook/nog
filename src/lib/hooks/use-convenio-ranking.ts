import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/lib/stores/app-store';

export interface ConvenioRankingItem {
  convenio: string;
  total_bruto: number;
  total_glosa: number;
  total_repassado: number;
  count: number;
}

export function useConvenioRanking() {
  const clinicId = useAppStore((s) => s.activeClinicId);

  return useQuery({
    queryKey: ['convenio-ranking', clinicId],
    queryFn: async () => {
      const params = clinicId ? `?clinic_id=${clinicId}` : '';
      const res = await fetch(`/api/analytics/convenios${params}`);
      if (!res.ok) throw new Error('Failed to fetch convenio ranking');
      return res.json() as Promise<ConvenioRankingItem[]>;
    },
    enabled: !!clinicId,
  });
}
