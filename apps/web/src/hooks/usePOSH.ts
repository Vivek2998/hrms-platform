import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';

export function usePOSHCases() {
  return useQuery({
    queryKey: ['posh-cases'],
    queryFn: () => apiClient.get('/posh/cases').then((r) => r.data.data),
  });
}

export function useCreatePOSHCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/posh/cases', data).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['posh-cases'] }); toast.success('Case filed'); },
    onError: () => toast.error('Failed to file case'),
  });
}

export function useUpdatePOSHCaseStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, closedAt }: { id: string; status: string; closedAt?: string }) =>
      apiClient.patch(`/posh/cases/${id}/status`, { status, closedAt }).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['posh-cases'] }); toast.success('Case updated'); },
    onError: () => toast.error('Failed to update case'),
  });
}

export function useAddPOSHUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      apiClient.post(`/posh/cases/${id}/updates`, { note }).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['posh-cases'] }); toast.success('Update added'); },
    onError: () => toast.error('Failed to add update'),
  });
}
