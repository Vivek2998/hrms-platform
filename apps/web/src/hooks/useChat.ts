import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';

export function useChatSessions() {
  return useQuery({
    queryKey: ['chat-sessions'],
    queryFn: () => apiClient.get('/chat/sessions').then((r) => r.data.data),
  });
}

export function useCreateChatSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post('/chat/sessions').then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chat-sessions'] }),
    onError: () => toast.error('Failed to start session'),
  });
}

export function useChatMessages(sessionId: string) {
  return useQuery({
    queryKey: ['chat-messages', sessionId],
    queryFn: () => apiClient.get(`/chat/sessions/${sessionId}/messages`).then((r) => r.data.data),
    enabled: !!sessionId,
  });
}

export function useSendChatMessage(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      apiClient.post(`/chat/sessions/${sessionId}/messages`, { content }).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chat-messages', sessionId] }),
    onError: () => toast.error('Failed to send message'),
  });
}
