import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@hrms/shared-types';

export interface Shift {
  id: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  graceMinutes: number;
  halfDayAfterMinutes: number;
  absentAfterMinutes: number;
  breakDurationMinutes: number;
  isNightShift: boolean;
  weeklyOffDays: number[];
  isActive: boolean;
}

export interface ShiftPayload {
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  graceMinutes: number;
  halfDayAfterMinutes: number;
  absentAfterMinutes: number;
  breakDurationMinutes: number;
  isNightShift: boolean;
  weeklyOffDays: number[];
}

const shiftKeys = {
  all: ['shifts'] as const,
  list: () => ['shifts', 'list'] as const,
};

export function useShifts() {
  return useQuery({
    queryKey: shiftKeys.list(),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<{ data?: Shift[] } | Shift[]>>('/shifts', {
        params: { limit: 100 },
      });
      const raw = res.data.data;
      if (Array.isArray(raw)) return raw as Shift[];
      return (raw as { data?: Shift[] }).data ?? [];
    },
  });
}

export function useCreateShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: ShiftPayload) => {
      const res = await apiClient.post<ApiResponse<Shift>>('/shifts', data);
      return res.data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: shiftKeys.all });
      toast.success('Shift created');
    },
  });
}

export function useUpdateShift(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ShiftPayload>) => {
      const res = await apiClient.patch<ApiResponse<Shift>>(`/shifts/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: shiftKeys.all });
      toast.success('Shift updated');
    },
  });
}

export function useDeleteShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/shifts/${id}`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: shiftKeys.all });
      toast.success('Shift deleted');
    },
  });
}
