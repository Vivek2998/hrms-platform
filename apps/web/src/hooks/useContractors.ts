import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';

export function useContractors() {
  return useQuery({
    queryKey: ['contractors'],
    queryFn: () => apiClient.get('/contractors').then((r) => r.data.data),
  });
}

export function useContractor(id: string | null) {
  return useQuery({
    queryKey: ['contractors', id],
    queryFn: () =>
      apiClient.get(`/contractors/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreateContractor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiClient.post('/contractors', data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contractors'] });
      toast.success('Contractor added');
    },
    onError: () => toast.error('Failed to add contractor'),
  });
}

export function useUpdateContractor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) =>
      apiClient.patch(`/contractors/${id}`, data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contractors'] });
      toast.success('Contractor updated');
    },
    onError: () => toast.error('Failed to update contractor'),
  });
}

export function useCreatePO() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      contractorId,
      ...data
    }: {
      contractorId: string;
      [key: string]: any;
    }) =>
      apiClient
        .post(`/contractors/${contractorId}/purchase-orders`, data)
        .then((r) => r.data.data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['contractors', vars.contractorId] });
      qc.invalidateQueries({ queryKey: ['contractors'] });
      toast.success('Purchase order created');
    },
    onError: () => toast.error('Failed to create PO'),
  });
}

export function useUpdatePOStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      contractorId,
      poId,
      status,
    }: {
      contractorId: string;
      poId: string;
      status: string;
    }) =>
      apiClient
        .patch(`/contractors/${contractorId}/purchase-orders/${poId}`, { status })
        .then((r) => r.data.data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['contractors', vars.contractorId] });
      toast.success('PO status updated');
    },
    onError: () => toast.error('Failed to update PO'),
  });
}
