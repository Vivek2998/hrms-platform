import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';
import type { ApiResponse, ESignatureRequest } from '@hrms/shared-types';

export function useMySignatureRequests() {
  return useQuery({
    queryKey: ['esignatures', 'my-requests'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<ESignatureRequest[]>>('/esignatures/my-requests');
      return res.data.data;
    },
  });
}

export function usePendingSignatures() {
  return useQuery({
    queryKey: ['esignatures', 'pending'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<ESignatureRequest[]>>('/esignatures/pending');
      return res.data.data;
    },
  });
}

export function useAllSignatures() {
  return useQuery({
    queryKey: ['esignatures', 'all'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<ESignatureRequest[]>>('/esignatures');
      return res.data.data;
    },
  });
}

export function useCreateSignatureRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      requestedTo: string;
      documentName: string;
      documentUrl: string;
      documentId?: string;
      message?: string;
      expiresAt?: string;
    }) => apiClient.post('/esignatures', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['esignatures'] });
      toast.success('Signature request sent');
    },
    onError: () => toast.error('Failed to send signature request'),
  });
}

export function useSignDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, signatureImageUrl }: { id: string; signatureImageUrl: string }) =>
      apiClient.patch(`/esignatures/${id}/sign`, { signatureImageUrl }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['esignatures'] });
      toast.success('Document signed successfully');
    },
    onError: () => toast.error('Failed to sign document'),
  });
}

export function useDeclineSignature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiClient.patch(`/esignatures/${id}/decline`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['esignatures'] });
      toast.success('Signature request declined');
    },
    onError: () => toast.error('Failed to decline'),
  });
}

export function useDeleteSignatureRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/esignatures/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['esignatures'] });
      toast.success('Signature request cancelled');
    },
    onError: () => toast.error('Failed to cancel'),
  });
}
