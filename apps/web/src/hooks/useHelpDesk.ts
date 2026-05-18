import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@hrms/shared-types';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketCategory = 'GENERAL' | 'PAYROLL' | 'ATTENDANCE' | 'LEAVE' | 'IT' | 'HR' | 'OTHER';

export interface TicketComment {
  id: string;
  ticketId: string;
  authorId: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
}

export interface HelpDeskTicket {
  id: string;
  organizationId: string;
  employeeId: string;
  subject: string;
  description: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  assignedTo?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: {
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
    designation?: string | null;
  } | null;
  _count?: { comments: number };
  comments?: TicketComment[];
}

export function useHelpDeskTickets(status?: TicketStatus) {
  return useQuery({
    queryKey: ['helpdesk-tickets', status ?? 'all'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<HelpDeskTicket[]>>('/helpdesk/tickets', {
        params: status ? { status } : {},
      });
      return res.data.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useHelpDeskTicket(id: string | null) {
  return useQuery({
    queryKey: ['helpdesk-ticket', id],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<HelpDeskTicket>>(`/helpdesk/tickets/${id!}`);
      return res.data.data;
    },
    staleTime: 30 * 1000,
    enabled: !!id,
  });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      subject: string;
      description: string;
      category: TicketCategory;
      priority: TicketPriority;
    }) => {
      const res = await apiClient.post<ApiResponse<HelpDeskTicket>>('/helpdesk/tickets', data);
      return res.data.data;
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['helpdesk-tickets'] }); },
  });
}

export function useUpdateTicketStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, assignedTo }: { id: string; status: TicketStatus; assignedTo?: string }) => {
      const res = await apiClient.patch<ApiResponse<HelpDeskTicket>>(`/helpdesk/tickets/${id}`, { status, assignedTo });
      return res.data.data;
    },
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: ['helpdesk-tickets'] });
      void qc.invalidateQueries({ queryKey: ['helpdesk-ticket', id] });
    },
  });
}

export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, body, isInternal }: { ticketId: string; body: string; isInternal?: boolean }) => {
      const res = await apiClient.post<ApiResponse<TicketComment>>(
        `/helpdesk/tickets/${ticketId}/comments`,
        { body, isInternal: isInternal ?? false },
      );
      return res.data.data;
    },
    onSuccess: (_, { ticketId }) => {
      void qc.invalidateQueries({ queryKey: ['helpdesk-ticket', ticketId] });
    },
  });
}
