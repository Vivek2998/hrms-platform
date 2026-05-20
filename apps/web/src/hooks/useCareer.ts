import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';

export function useDesignations() {
  return useQuery({
    queryKey: ['designations'],
    queryFn: () => apiClient.get('/designations').then((r) => r.data.data),
  });
}

export function useCreateDesignation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/designations', data).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['designations'] }); toast.success('Designation created'); },
    onError: () => toast.error('Failed to create designation'),
  });
}

export function useCareerPaths() {
  return useQuery({
    queryKey: ['career-paths'],
    queryFn: () => apiClient.get('/career-paths').then((r) => r.data.data),
  });
}

export function useCareerPathsFrom(designationId: string) {
  return useQuery({
    queryKey: ['career-paths-from', designationId],
    queryFn: () => apiClient.get(`/career-paths/from/${designationId}`).then((r) => r.data.data),
    enabled: !!designationId,
  });
}

export function useCreateCareerPath() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/career-paths', data).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['career-paths'] }); toast.success('Career path created'); },
    onError: () => toast.error('Failed to create career path'),
  });
}

export function useDeleteCareerPath() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/career-paths/${id}`).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['career-paths'] }); toast.success('Path removed'); },
    onError: () => toast.error('Failed to remove path'),
  });
}
