import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@hrms/shared-types';

interface Department {
  id: string;
  name: string;
  code: string;
}

interface DepartmentListResult {
  departments: Department[];
}

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<DepartmentListResult>>('/departments');
      return (res.data.data as unknown as Department[]) ?? [];
    },
  });
}
