import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@hrms/shared-types';

export type DocumentStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export type DocumentType =
  | 'OFFER_LETTER'
  | 'APPOINTMENT_LETTER'
  | 'ID_PROOF'
  | 'ADDRESS_PROOF'
  | 'EDUCATIONAL'
  | 'EXPERIENCE_LETTER'
  | 'RELIEVING_LETTER'
  | 'PAYSLIP'
  | 'FORM_16'
  | 'PF_STATEMENT'
  | 'ID_CARD'
  | 'INSURANCE'
  | 'NDA'
  | 'AGREEMENT'
  | 'COMPANY_POLICY'
  | 'BACKGROUND_CHECK'
  | 'MEDICAL_CERTIFICATE'
  | 'OTHER';

export const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  OFFER_LETTER: 'Offer Letter',
  APPOINTMENT_LETTER: 'Appointment Letter',
  ID_PROOF: 'ID Proof',
  ADDRESS_PROOF: 'Address Proof',
  EDUCATIONAL: 'Educational Certificate',
  EXPERIENCE_LETTER: 'Experience Letter',
  RELIEVING_LETTER: 'Relieving Letter',
  PAYSLIP: 'Payslip',
  FORM_16: 'Form 16',
  PF_STATEMENT: 'PF Statement',
  ID_CARD: 'ID Card',
  INSURANCE: 'Insurance Card',
  NDA: 'NDA',
  AGREEMENT: 'Agreement',
  COMPANY_POLICY: 'Company Policy',
  BACKGROUND_CHECK: 'Background Check',
  MEDICAL_CERTIFICATE: 'Medical Certificate',
  OTHER: 'Other',
};

export const DOC_CATEGORIES: { label: string; types: DocumentType[] }[] = [
  {
    label: 'Company Issued',
    types: ['OFFER_LETTER', 'APPOINTMENT_LETTER', 'ID_CARD', 'INSURANCE', 'COMPANY_POLICY', 'EXPERIENCE_LETTER', 'RELIEVING_LETTER'],
  },
  {
    label: 'Financial',
    types: ['PAYSLIP', 'FORM_16', 'PF_STATEMENT'],
  },
  {
    label: 'Personal',
    types: ['ID_PROOF', 'ADDRESS_PROOF', 'EDUCATIONAL', 'MEDICAL_CERTIFICATE'],
  },
  {
    label: 'Legal & Compliance',
    types: ['NDA', 'AGREEMENT', 'BACKGROUND_CHECK'],
  },
  {
    label: 'Other',
    types: ['OTHER'],
  },
];

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  organizationId: string;
  type: DocumentType;
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
  uploadedBy: string;
  status: DocumentStatus;
  expiresAt?: string | null;
  notes?: string | null;
  createdAt: string;
}

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
      expiresAt?: string | null;
      notes?: string;
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

export function useApproveDocument(employeeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch<ApiResponse<EmployeeDocument>>(`/documents/${id}/approve`);
      return res.data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: docKeys.list(employeeId) });
      toast.success('Document approved');
    },
  });
}

export function useRejectDocument(employeeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const res = await apiClient.patch<ApiResponse<EmployeeDocument>>(`/documents/${id}/reject`, { notes });
      return res.data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: docKeys.list(employeeId) });
      toast.success('Document rejected');
    },
  });
}
