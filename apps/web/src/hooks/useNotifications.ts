import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';

export interface AppNotification {
  id: string;
  organizationId: string;
  employeeId: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: { count: number } }>('/notifications/unread-count');
      return res.data.data;
    },
    refetchInterval: 30_000,
    refetchIntervalInBackground: true, // keep polling even when browser tab is not focused
    refetchOnWindowFocus: true,        // override global false — badge must stay current
    staleTime: 15_000,
  });
}

export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: AppNotification[] }>('/notifications?limit=30');
      return res.data.data;
    },
    enabled,
    staleTime: 15_000,
    refetchInterval: enabled ? 30_000 : false, // live-poll while the panel is open
    refetchOnWindowFocus: true,                // refresh list when returning to the tab
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.patch('/notifications/read-all');
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
