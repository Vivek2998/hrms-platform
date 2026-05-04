import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';
import type { ApiResponse, LeaveStatus } from '@hrms/shared-types';

export interface LeaveRecord {
  id: string;
  organizationId: string;
  employeeId: string;
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  status: LeaveStatus;
  reason: string;
  attachmentUrl?: string | null;
  createdAt: string;
  employee?: { id: string; firstName: string; lastName: string; employeeCode: string };
  leaveType?: { id: string; name: string; code: string };
  approvals?: {
    approver?: { id: string; firstName: string; lastName: string };
    remarks?: string | null;
    action: string;
    createdAt: string;
  }[];
}

interface LeaveParams {
  page?: number;
  limit?: number;
  status?: LeaveStatus;
  employeeId?: string;
}

export const leaveKeys = {
  all: ['leaves'] as const,
  list: (params: LeaveParams) => ['leaves', 'list', params] as const,
};

export function useLeaves(params: LeaveParams = {}) {
  return useQuery({
    queryKey: leaveKeys.list(params),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<LeaveRecord[]>>('/leaves', { params });
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return { data: res.data.data, meta: res.data.meta! };
    },
  });
}

export function useApproveLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      action,
      remarks,
    }: {
      id: string;
      action: 'APPROVED' | 'REJECTED';
      remarks?: string;
    }) => {
      const res = await apiClient.patch<ApiResponse<{ message: string }>>(`/leaves/${id}/approve`, {
        action,
        ...(remarks ? { remarks } : {}),
      });
      return res.data.data;
    },
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: leaveKeys.all });
      toast.success(
        vars.action === 'APPROVED' ? 'Leave request approved' : 'Leave request rejected',
      );
    },
  });
}
