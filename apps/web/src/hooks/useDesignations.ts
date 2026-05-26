import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@/lib/axios';

export interface Designation {
  id: string;
  name: string;
  level: number;
  department: string | null;
  description: string | null;
  skills: string[];
  parentId: string | null;
  templateKey: string | null;
  parent?: { id: string; name: string } | null;
  _count?: { employees: number };
  createdAt: string;
}

export interface DesignationWithEmployees extends Designation {
  employees: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    employeeCode: string;
  }[];
}

export interface OrgSettings {
  id: string;
  name: string;
  industryType: string;
  employeeCodePrefix: string;
  timezone: string;
}

const keys = {
  list: ['designations'] as const,
  withEmployees: ['designations', 'with-employees'] as const,
  settings: ['org-settings', 'general'] as const,
};

export function useDesignations() {
  return useQuery({
    queryKey: keys.list,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Designation[]>>('/designations');
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useDesignationsWithEmployees() {
  return useQuery({
    queryKey: keys.withEmployees,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<DesignationWithEmployees[]>>(
        '/designations/with-employees',
      );
      return res.data.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useOrgSettings() {
  return useQuery({
    queryKey: keys.settings,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<OrgSettings>>('/organizations/settings/general');
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateOrgSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { industryType?: string; timezone?: string }) => {
      const res = await apiClient.patch<ApiResponse<OrgSettings>>(
        '/organizations/settings/general',
        data,
      );
      return res.data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.settings }),
  });
}

export function useSeedDesignations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<ApiResponse<{ seeded: number; industry: string }>>(
        '/designations/seed',
        {},
      );
      return res.data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.list });
      void qc.invalidateQueries({ queryKey: keys.withEmployees });
    },
  });
}

export function useAssignEmployeeToDesignation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, designationId }: { employeeId: string; designationId: string | null }) => {
      await apiClient.patch(`/employees/${employeeId}`, { designationId });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.withEmployees });
      void qc.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}
