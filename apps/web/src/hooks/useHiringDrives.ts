import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';

export function useHiringDrives() {
  return useQuery({
    queryKey: ['hiring-drives'],
    queryFn: () => apiClient.get('/hiring-drives').then((r) => r.data.data),
  });
}

export function useDriveCandidates(driveId: string | null) {
  return useQuery({
    queryKey: ['hiring-drive-candidates', driveId],
    queryFn: () =>
      apiClient.get(`/hiring-drives/${driveId}/candidates`).then((r) => r.data.data),
    enabled: !!driveId,
  });
}

export function useCreateDrive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiClient.post('/hiring-drives', data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hiring-drives'] });
      toast.success('Hiring drive created');
    },
    onError: () => toast.error('Failed to create drive'),
  });
}

export function useUpdateDrive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) =>
      apiClient.patch(`/hiring-drives/${id}`, data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hiring-drives'] });
      toast.success('Drive updated');
    },
    onError: () => toast.error('Failed to update drive'),
  });
}

export function useAddCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ driveId, ...data }: { driveId: string; [key: string]: any }) =>
      apiClient.post(`/hiring-drives/${driveId}/candidates`, data).then((r) => r.data.data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['hiring-drive-candidates', vars.driveId] });
      qc.invalidateQueries({ queryKey: ['hiring-drives'] });
      toast.success('Candidate added');
    },
    onError: () => toast.error('Failed to add candidate'),
  });
}

export function useBulkImportCandidates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ driveId, candidates }: { driveId: string; candidates: any[] }) =>
      apiClient
        .post(`/hiring-drives/${driveId}/candidates/bulk`, { candidates })
        .then((r) => r.data.data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['hiring-drive-candidates', vars.driveId] });
      qc.invalidateQueries({ queryKey: ['hiring-drives'] });
      toast.success('Candidates imported');
    },
    onError: () => toast.error('Failed to import candidates'),
  });
}

export function useUpdateCandidateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      driveId,
      candidateId,
      status,
    }: {
      driveId: string;
      candidateId: string;
      status: string;
    }) =>
      apiClient
        .patch(`/hiring-drives/${driveId}/candidates/${candidateId}`, { status })
        .then((r) => r.data.data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['hiring-drive-candidates', vars.driveId] });
      toast.success('Status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });
}
