import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';

export function useEAPResources(category?: string) {
  return useQuery({
    queryKey: ['eap', category ?? 'all'],
    queryFn: () =>
      apiClient
        .get('/eap', { params: category ? { category } : undefined })
        .then((r) => r.data.data),
  });
}

export function useCreateEAPResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiClient.post('/eap', data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eap'] });
      toast.success('Resource added');
    },
    onError: () => toast.error('Failed to add resource'),
  });
}

export function useUpdateEAPResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) =>
      apiClient.patch(`/eap/${id}`, data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eap'] });
      toast.success('Resource updated');
    },
    onError: () => toast.error('Failed to update resource'),
  });
}

export function useDeleteEAPResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/eap/${id}`).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eap'] });
      toast.success('Resource deleted');
    },
    onError: () => toast.error('Failed to delete resource'),
  });
}
