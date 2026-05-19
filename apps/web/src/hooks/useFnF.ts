import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export function useFnFSettlements() {
  return useQuery({
    queryKey: ['fnf'],
    queryFn: async () => {
      const res = await api.get('/fnf');
      return res.data.data as any[];
    },
  });
}

export function useEmployeeFnF(employeeId?: string) {
  return useQuery({
    queryKey: ['fnf', employeeId],
    queryFn: async () => {
      const res = await api.get(`/fnf/${employeeId}`);
      return res.data.data as any;
    },
    enabled: !!employeeId,
  });
}

export function useCreateFnF() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post('/fnf', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fnf'] }),
  });
}

export function useUpdateFnF() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [k: string]: any }) => api.patch(`/fnf/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fnf'] }),
  });
}

export function useSubmitFnF() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/fnf/${id}/submit`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fnf'] }),
  });
}

export function useApproveFnF() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/fnf/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fnf'] }),
  });
}

export function useMarkFnFPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/fnf/${id}/paid`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fnf'] }),
  });
}
