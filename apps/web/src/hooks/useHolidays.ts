import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@hrms/shared-types';

export interface Holiday {
  id: string;
  organizationId: string;
  name: string;
  date: string;
  type: 'NATIONAL' | 'REGIONAL' | 'OPTIONAL';
  year: number;
  createdAt: string;
}

interface CreateHolidayInput {
  name: string;
  date: string;
  type: 'NATIONAL' | 'REGIONAL' | 'OPTIONAL';
}

export const holidayKeys = {
  all: ['holidays'] as const,
  byYear: (year: number) => ['holidays', year] as const,
};

export function useHolidays(year?: number) {
  const y = year ?? new Date().getFullYear();
  return useQuery({
    queryKey: holidayKeys.byYear(y),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Holiday[]>>('/holidays', {
        params: { year: y },
      });
      return res.data.data;
    },
  });
}

export function useCreateHoliday(year: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateHolidayInput) => {
      const res = await apiClient.post<ApiResponse<Holiday>>('/holidays', input);
      return res.data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: holidayKeys.byYear(year) });
      toast.success('Holiday added');
    },
    onError: () => {
      toast.error('Failed to add holiday');
    },
  });
}

export function useDeleteHoliday(year: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/holidays/${id}`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: holidayKeys.byYear(year) });
      toast.success('Holiday removed');
    },
    onError: () => {
      toast.error('Failed to remove holiday');
    },
  });
}
