import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/lib/stores/app-store';

export function useDashboardData() {
  const clinicId = useAppStore((s) => s.activeClinicId);

  return useQuery({
    queryKey: ['dashboard-summary', clinicId],
    queryFn: async () => {
      const params = clinicId ? `?clinic_id=${clinicId}` : '';
      const res = await fetch(`/api/analytics/dashboard-summary${params}`);
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      return res.json();
    },
    enabled: !!clinicId,
  });
}
