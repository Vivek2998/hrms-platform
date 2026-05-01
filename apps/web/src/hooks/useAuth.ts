import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { apiClient } from "@/lib/axios";
import { useAuthStore } from "@/stores/auth.store";
import type { ApiResponse } from "@hrms/shared-types";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    orgId: string;
    orgName: string;
    role: import("@hrms/shared-types").UserRole;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  };
}

export { loginSchema };

export function useLogin() {
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const res = await apiClient.post<ApiResponse<LoginResponse>>(
        "/auth/login",
        input,
      );
      return res.data.data;
    },
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      toast.success(`Welcome back, ${data.user.firstName}!`);
      void navigate("/dashboard");
    },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      await apiClient.post("/auth/logout");
    },
    onSettled: () => {
      logout();
      void navigate("/login");
    },
  });
}
