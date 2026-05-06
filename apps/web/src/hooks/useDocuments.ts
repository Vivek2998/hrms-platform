import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@hrms/shared-types';

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  organizationId: string;
  type: string;
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
  uploadedBy: string;
  createdAt: string;
}

export type DocumentType =
  | 'OFFER_LETTER'
  | 'APPOINTMENT_LETTER'
  | 'ID_PROOF'
  | 'ADDRESS_PROOF'
  | 'EDUCATIONAL'
  | 'PAYSLIP'
  | 'FORM_16'
  | 'EXPERIENCE_LETTER'
  | 'RELIEVING_LETTER'
  | 'OTHER';

const docKeys = {
  list: (employeeId: string) => ['documents', employeeId] as const,
};

export function useDocuments(employeeId: string) {
  return useQuery({
    queryKey: docKeys.list(employeeId),
    queryFn: async (): Promise<EmployeeDocument[]> => {
      const res = await apiClient.get<ApiResponse<EmployeeDocument[]>>('/documents', {
        params: { employeeId },
      });
      return res.data.data;
    },
    enabled: Boolean(employeeId),
  });
}

export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      employeeId: string;
      type: DocumentType;
      name: string;
      url: string;
      size?: number;
      mimeType?: string;
    }) => {
      const res = await apiClient.post<ApiResponse<EmployeeDocument>>('/documents', data);
      return res.data.data;
    },
    onSuccess: (doc) => {
      void qc.invalidateQueries({ queryKey: docKeys.list(doc.employeeId) });
      toast.success('Document uploaded successfully');
    },
  });
}

export function useDeleteDocument(employeeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/documents/${id}`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: docKeys.list(employeeId) });
      toast.success('Document deleted');
    },
  });
}
