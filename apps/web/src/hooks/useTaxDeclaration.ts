import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@hrms/shared-types';

export interface TaxDeclaration {
  id: string;
  organizationId: string;
  employeeId: string;
  financialYear: string;
  regime: 'OLD' | 'NEW';
  ppf?: number | null;
  epf?: number | null;
  elss?: number | null;
  lic?: number | null;
  nsc?: number | null;
  homeLoanPrincipal?: number | null;
  tuitionFees?: number | null;
  sukanyaSamriddhi?: number | null;
  healthInsuranceSelf?: number | null;
  healthInsuranceParents?: number | null;
  rentPaid?: number | null;
  landlordPan?: string | null;
  npsEmployee?: number | null;
  homeLoanInterest?: number | null;
  savingsInterest?: number | null;
  otherDeductions?: Record<string, number> | null;
  totalDeclared: number;
  status: 'DRAFT' | 'SUBMITTED' | 'VERIFIED';
  submittedAt?: string | null;
  verifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TaxDeclarationInput = Omit<
  TaxDeclaration,
  'id' | 'organizationId' | 'employeeId' | 'totalDeclared' | 'status' | 'submittedAt' | 'verifiedAt' | 'createdAt' | 'updatedAt'
>;

export const taxDeclarationKeys = {
  all: ['tax-declarations'] as const,
  my: (year?: string) => ['tax-declarations', 'my', year ?? 'all'] as const,
  hrAll: (year?: string) => ['tax-declarations', 'hr', year ?? 'all'] as const,
};

export function useMyTaxDeclarations(financialYear?: string) {
  return useQuery({
    queryKey: taxDeclarationKeys.my(financialYear),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<TaxDeclaration[]>>('/tax-declarations/my', {
        params: financialYear ? { financialYear } : {},
      });
      return res.data.data;
    },
  });
}

export function useSaveTaxDeclaration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TaxDeclarationInput) => {
      const res = await apiClient.post<ApiResponse<TaxDeclaration>>('/tax-declarations', input);
      return res.data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: taxDeclarationKeys.all });
      toast.success('Declaration saved as draft');
    },
    onError: () => {
      toast.error('Failed to save declaration');
    },
  });
}

export function useSubmitTaxDeclaration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/tax-declarations/${id}/submit`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: taxDeclarationKeys.all });
      toast.success('Declaration submitted to HR');
    },
    onError: () => {
      toast.error('Failed to submit declaration');
    },
  });
}

export function useVerifyTaxDeclaration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/tax-declarations/${id}/verify`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: taxDeclarationKeys.all });
      toast.success('Declaration verified');
    },
    onError: () => {
      toast.error('Failed to verify declaration');
    },
  });
}
