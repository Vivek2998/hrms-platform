import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';
import { useAuthStore } from '@/stores/auth.store';
import type { ApiResponse, UserRole, OrgPlan } from '@hrms/shared-types';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  employee: {
    id: string;
    organizationId: string;
    orgName: string;
    orgPlan: OrgPlan;
    role: UserRole;
    firstName: string;
    lastName: string;
    workEmail: string;
    employeeCode: string;
    avatarUrl: string | null;
    mustChangePassword: boolean;
  };
}

export { loginSchema };

export function useLogin() {
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const res = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', input);
      return res.data.data;
    },
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      setUser({
        id: data.employee.id,
        organizationId: data.employee.organizationId,
        orgName: data.employee.orgName,
        orgPlan: data.employee.orgPlan,
        role: data.employee.role,
        firstName: data.employee.firstName,
        lastName: data.employee.lastName,
        workEmail: data.employee.workEmail,
        employeeCode: data.employee.employeeCode,
        avatarUrl: data.employee.avatarUrl,
        mustChangePassword: data.employee.mustChangePassword,
      });
      toast.success(`Welcome back, ${data.employee.firstName}!`);
      void navigate('/dashboard');
    },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/logout');
    },
    onSettled: () => {
      logout();
      void navigate('/login');
    },
  });
}
