import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';

export function useComplianceCalendar() {
  return useQuery({
    queryKey: ['compliance-calendar'],
    queryFn: () => apiClient.get('/compliance/calendar').then((r) => r.data.data),
  });
}
