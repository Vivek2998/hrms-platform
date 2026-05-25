import axios, { type AxiosError } from 'axios';
import { useAuthStore } from '@/stores/auth.store';

export const BASE_URL: string =
  (import.meta.env['VITE_API_URL'] as string | undefined) ??
  (import.meta.env.PROD
    ? 'https://hrms-platform-production.up.railway.app'
    : 'http://localhost:3000');

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && originalRequest && !('_retry' in originalRequest)) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      Object.assign(originalRequest, { _retry: true });
      isRefreshing = true;

      const { refreshToken, setTokens, logout } = useAuthStore.getState();
      if (!refreshToken) {
        logout();
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const res = await axios.post<{
          data: { accessToken: string; refreshToken: string };
        }>(`${BASE_URL}/api/v1/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = res.data.data;
        setTokens(accessToken, newRefresh);
        refreshQueue.forEach((cb) => {
          cb(accessToken);
        });
        refreshQueue = [];
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return await apiClient(originalRequest);
      } catch {
        useAuthStore.getState().logout();
        // eslint-disable-next-line @typescript-eslint/return-await
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);
