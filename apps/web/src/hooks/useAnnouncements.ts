import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';

export interface Announcement {
  id: string;
  organizationId: string;
  authorId: string;
  title: string;
  content: string;
  isPinned: boolean;
  visibleTo: string[];
  expiresAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementInput {
  title: string;
  content: string;
  isPinned?: boolean;
  expiresAt?: string;
}

const announcementKeys = {
  all: ['announcements'] as const,
  list: () => ['announcements', 'list'] as const,
};

export function useAnnouncements() {
  return useQuery({
    queryKey: announcementKeys.list(),
    queryFn: async () => {
      const res = await apiClient.get<{ data: Announcement[]; meta: { total: number } }>(
        '/announcements',
        { params: { limit: 50 } },
      );
      return res.data.data;
    },
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AnnouncementInput) => {
      const res = await apiClient.post<{ data: Announcement }>('/announcements', input);
      return res.data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: announcementKeys.all });
      toast.success('Announcement posted');
    },
  });
}

export function useUpdateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<AnnouncementInput> & { isPinned?: boolean } }) => {
      const res = await apiClient.patch<{ data: Announcement }>(`/announcements/${id}`, input);
      return res.data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: announcementKeys.all });
      toast.success('Announcement updated');
    },
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/announcements/${id}`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: announcementKeys.all });
      toast.success('Announcement deleted');
    },
  });
}
