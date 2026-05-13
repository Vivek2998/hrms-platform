import axios from 'axios';
import { useSuperAdminAuthStore } from '@/stores/super-admin-auth.store';

const BASE_URL: string =
  (import.meta.env['VITE_API_URL'] as string | undefined) ??
  (import.meta.env.PROD
    ? 'https://hrms-platform-production.up.railway.app'
    : 'http://localhost:3000');

export const superAdminApi = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

superAdminApi.interceptors.request.use((config) => {
  const token = useSuperAdminAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

superAdminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useSuperAdminAuthStore.getState().logout();
      window.location.href = '/super-admin/login';
    }
    return Promise.reject(error);
  },
);
