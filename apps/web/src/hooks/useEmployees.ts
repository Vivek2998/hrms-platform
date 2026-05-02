import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/axios";
import type { Employee, ApiResponse, PaginationMeta } from "@hrms/shared-types";

interface EmployeeListParams {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  status?: string;
}

interface EmployeeListResult {
  employees: Employee[];
  meta: PaginationMeta;
}

export const employeeKeys = {
  all: ["employees"] as const,
  list: (params: EmployeeListParams) => ["employees", "list", params] as const,
  detail: (id: string) => ["employees", "detail", id] as const,
};

export function useEmployees(params: EmployeeListParams = {}) {
  return useQuery({
    queryKey: employeeKeys.list(params),
    queryFn: async (): Promise<EmployeeListResult> => {
      const res = await apiClient.get<ApiResponse<Employee[]>>(
        "/employees",
        { params },
      );
      return { employees: res.data.data, meta: res.data.meta! };
    },
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Employee>>(`/employees/${id}`);
      return res.data.data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Employee>) => {
      const res = await apiClient.post<ApiResponse<Employee>>("/employees", data);
      return res.data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: employeeKeys.all });
      toast.success("Employee created successfully");
    },
  });
}

export function useUpdateEmployee(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Employee>) => {
      const res = await apiClient.patch<ApiResponse<Employee>>(
        `/employees/${id}`,
        data,
      );
      return res.data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: employeeKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: employeeKeys.all });
      toast.success("Employee updated successfully");
    },
  });
}
