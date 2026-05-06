import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@hrms/shared-types';

export interface DirectoryEmployee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  designation?: string | null;
  workEmail: string;
  phone?: string | null;
  avatarUrl?: string | null;
  dateOfJoining?: string | null;
  department?: { id: string; name: string } | null;
  manager?: { id: string; firstName: string; lastName: string } | null;
}

export interface OrgChartEmployee {
  id: string;
  firstName: string;
  lastName: string;
  designation?: string | null;
  avatarUrl?: string | null;
  managerId?: string | null;
  department?: { name: string } | null;
}

export function useDirectory(search?: string) {
  return useQuery({
    queryKey: ['directory', search ?? ''],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<DirectoryEmployee[]>>(
        '/employees/directory',
        { params: search ? { search } : {} },
      );
      return res.data.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useOrgChart() {
  return useQuery({
    queryKey: ['org-chart'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<OrgChartEmployee[]>>('/employees/org-chart');
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
