import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';

export function useParsedResumes() {
  return useQuery({
    queryKey: ['resume-parse'],
    queryFn: () => apiClient.get('/resume-parse').then((r) => r.data.data),
  });
}

export function useParsedResume(id: string | null) {
  return useQuery({
    queryKey: ['resume-parse', id],
    queryFn: () =>
      apiClient.get(`/resume-parse/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useUploadResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { fileName: string; fileUrl: string; text: string }) =>
      apiClient.post('/resume-parse', data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resume-parse'] });
      toast.success('Resume uploaded and queued for parsing');
    },
    onError: () => toast.error('Failed to upload resume'),
  });
}

export function useReparseResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post(`/resume-parse/${id}/reparse`).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resume-parse'] });
      toast.success('Re-parse initiated');
    },
    onError: () => toast.error('Failed to re-parse'),
  });
}
