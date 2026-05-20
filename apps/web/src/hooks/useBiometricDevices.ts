import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';

export function useBiometricDevices() {
  return useQuery({
    queryKey: ['biometric-devices'],
    queryFn: () => apiClient.get('/biometric-devices').then((r) => r.data.data),
  });
}

export function useDeviceLogs(id: string | null) {
  return useQuery({
    queryKey: ['biometric-device-logs', id],
    queryFn: () =>
      apiClient.get(`/biometric-devices/${id}/logs`).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreateDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiClient.post('/biometric-devices', data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['biometric-devices'] });
      toast.success('Device added');
    },
    onError: () => toast.error('Failed to add device'),
  });
}

export function useUpdateDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) =>
      apiClient.patch(`/biometric-devices/${id}`, data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['biometric-devices'] });
      toast.success('Device updated');
    },
    onError: () => toast.error('Failed to update device'),
  });
}

export function useDeleteDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/biometric-devices/${id}`).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['biometric-devices'] });
      toast.success('Device deleted');
    },
    onError: () => toast.error('Failed to delete device'),
  });
}
