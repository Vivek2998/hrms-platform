import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@hrms/shared-types';

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  headId?: string;
  parentId?: string;
  isActive: boolean;
  _count?: { employees: number };
}

interface DeptPayload {
  name: string;
  code: string;
  description?: string;
  headId?: string;
}

const deptKeys = {
  all: ['departments'] as const,
  list: (params?: object) => ['departments', 'list', params ?? {}] as const,
};

export function useDepartments(params?: { search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: deptKeys.list(params),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<{ departments?: Department[] } | Department[]>>(
        '/departments',
        { params },
      );
      const raw = res.data.data;
      if (Array.isArray(raw)) return raw as Department[];
      return (raw as { departments?: Department[] }).departments ?? (raw as Department[]);
    },
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: DeptPayload) => {
      const res = await apiClient.post<ApiResponse<Department>>('/departments', data);
      return res.data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: deptKeys.all });
      toast.success('Department created');
    },
  });
}

export function useUpdateDepartment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<DeptPayload>) => {
      const res = await apiClient.patch<ApiResponse<Department>>(`/departments/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: deptKeys.all });
      toast.success('Department updated');
    },
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/departments/${id}`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: deptKeys.all });
      toast.success('Department deleted');
    },
  });
}
