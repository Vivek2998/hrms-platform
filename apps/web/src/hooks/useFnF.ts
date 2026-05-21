import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';

export function useFnFSettlements() {
  return useQuery({
    queryKey: ['fnf'],
    queryFn: async () => {
      const res = await apiClient.get('/fnf');
      return res.data.data as any[];
    },
  });
}

export function useEmployeeFnF(employeeId?: string) {
  return useQuery({
    queryKey: ['fnf', employeeId],
    queryFn: async () => {
      const res = await apiClient.get(`/fnf/${employeeId}`);
      return res.data.data as any;
    },
    enabled: !!employeeId,
  });
}

export function useCreateFnF() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/fnf', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fnf'] }),
  });
}

export function useUpdateFnF() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [k: string]: any }) => apiClient.patch(`/fnf/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fnf'] }),
  });
}

export function useSubmitFnF() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.patch(`/fnf/${id}/submit`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fnf'] }),
  });
}

export function useApproveFnF() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.patch(`/fnf/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fnf'] }),
  });
}

export function useMarkFnFPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.patch(`/fnf/${id}/paid`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fnf'] }),
  });
}
