import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';

export function usePIPs() {
  return useQuery({
    queryKey: ['pips'],
    queryFn: () => apiClient.get('/pip').then((r) => r.data.data),
  });
}

export function useCreatePIP() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/pip', data).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pips'] }); toast.success('PIP created'); },
    onError: () => toast.error('Failed to create PIP'),
  });
}

export function useUpdatePIPStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/pip/${id}/status`, { status }).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pips'] }); toast.success('PIP status updated'); },
    onError: () => toast.error('Failed to update status'),
  });
}

export function useUpdatePIPGoals() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, goals }: { id: string; goals: any[] }) =>
      apiClient.put(`/pip/${id}/goals`, { goals }).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pips'] }); toast.success('Goals updated'); },
    onError: () => toast.error('Failed to update goals'),
  });
}

export function useAddPIPCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note, progressPct }: { id: string; note: string; progressPct?: number }) =>
      apiClient.post(`/pip/${id}/check-ins`, { note, progressPct }).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pips'] }); toast.success('Check-in recorded'); },
    onError: () => toast.error('Failed to record check-in'),
  });
}
