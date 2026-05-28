import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';
import type { ApiResponse, ExpenseClaim, ExpenseCategory } from '@hrms/shared-types';

export function useMyExpenses() {
  return useQuery({
    queryKey: ['expenses', 'my'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<ExpenseClaim[]>>('/expenses/my');
      return res.data.data;
    },
  });
}

export function useAllExpenses(
  params?: { status?: string; employeeId?: string },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ['expenses', 'all', params],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<ExpenseClaim[]>>('/expenses', { params });
      return res.data.data;
    },
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string;
      description?: string;
      category: ExpenseCategory;
      amount: number;
      currency?: string;
      receiptUrl?: string;
      expenseDate: string;
    }) => apiClient.post('/expenses', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense claim created');
    },
    onError: () => toast.error('Failed to create expense claim'),
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: unknown }) =>
      apiClient.patch(`/expenses/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense claim updated');
    },
    onError: () => toast.error('Failed to update expense claim'),
  });
}

export function useSubmitExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.patch(`/expenses/${id}/submit`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense claim submitted');
    },
    onError: () => toast.error('Failed to submit expense claim'),
  });
}

export function useReviewExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, reviewNote }: { id: string; action: 'APPROVE' | 'REJECT'; reviewNote?: string }) =>
      apiClient.patch(`/expenses/${id}/review`, { action, reviewNote }),
    onSuccess: (_, { action }) => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      toast.success(action === 'APPROVE' ? 'Expense approved' : 'Expense rejected');
    },
    onError: () => toast.error('Failed to review expense claim'),
  });
}

export function useMarkExpensePaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.patch(`/expenses/${id}/pay`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Marked as paid');
    },
    onError: () => toast.error('Failed to mark as paid'),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/expenses/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense claim deleted');
    },
    onError: () => toast.error('Failed to delete expense claim'),
  });
}
