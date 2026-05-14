import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';

export interface EmployeeLeaveBalance {
  id: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
  designation: string | null;
  leaveBalances: {
    id: string;
    leaveTypeId: string;
    year: number;
    allocated: number;
    used: number;
    pending: number;
    carried: number;
    leaveType: { id: string; name: string; code: string };
  }[];
}

export interface BalanceUpsertInput {
  employeeId: string;
  leaveTypeId: string;
  year: number;
  allocated: number;
}

const balanceKeys = {
  all: ['leave-balances'] as const,
  list: (year: number) => ['leave-balances', 'list', year] as const,
};

export function useLeaveBalances(year: number) {
  return useQuery({
    queryKey: balanceKeys.list(year),
    queryFn: async () => {
      const res = await apiClient.get<{
        data: EmployeeLeaveBalance[];
        meta: { total: number; page: number; limit: number };
      }>('/leaves/balances', { params: { year, limit: 200 } });
      return res.data;
    },
  });
}

export function useUpsertLeaveBalance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: BalanceUpsertInput) => {
      const res = await apiClient.post('/leaves/balance/upsert', input);
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: balanceKeys.all });
      toast.success('Leave balance updated');
    },
  });
}

export function useInitializeLeaveBalances() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (year: number) => {
      const res = await apiClient.post<{ data: { created: number; total: number } }>(
        '/leaves/balance/initialize',
        { year },
      );
      return res.data.data;
    },
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: balanceKeys.all });
      toast.success(`Initialized ${data.created} balance entries`);
    },
  });
}

export function useCarryForwardLeaveBalances() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ fromYear, toYear }: { fromYear: number; toYear: number }) => {
      const res = await apiClient.post<{ data: { carried: number; message: string } }>(
        '/leaves/balance/carry-forward',
        { fromYear, toYear },
      );
      return res.data.data;
    },
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: balanceKeys.all });
      toast.success(data.message);
    },
    onError: () => toast.error('Carry-forward failed'),
  });
}
