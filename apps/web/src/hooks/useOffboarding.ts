import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';

export type OffboardingTaskStatus = 'PENDING' | 'COMPLETED' | 'SKIPPED';
export type OffboardingStatus = 'INITIATED' | 'IN_PROGRESS' | 'COMPLETED';
export type AssignedRole = 'HR' | 'IT' | 'FINANCE' | 'MANAGER' | 'EMPLOYEE';

export interface OffboardingTaskDef {
  id: string;
  templateId: string;
  title: string;
  description: string | null;
  assignedRole: AssignedRole;
  dueBeforeDays: number;
  order: number;
}

export interface OffboardingTemplate {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count?: { tasks: number; assignments: number };
  tasks?: OffboardingTaskDef[];
}

export interface OffboardingAssignmentTask {
  id: string;
  assignmentId: string;
  taskId: string | null;
  title: string;
  assignedRole: AssignedRole;
  status: OffboardingTaskStatus;
  dueDate: string | null;
  completedAt: string | null;
  notes: string | null;
}

export interface OffboardingAssignment {
  id: string;
  employeeId: string;
  templateId: string | null;
  lastWorkingDate: string;
  reason: string | null;
  status: OffboardingStatus;
  createdAt: string;
  completedTasks?: number;
  employee: { id: string; firstName: string; lastName: string; designation?: string | null; avatarUrl?: string | null };
  template: { id: string; name: string };
  _count?: { tasks: number };
  tasks?: OffboardingAssignmentTask[];
}

export interface ExitInterview {
  id: string;
  assignmentId: string;
  reasonForLeaving: string | null;
  overallRating: number | null;
  managementRating: number | null;
  workEnvironment: number | null;
  growthOpportunities: number | null;
  wouldRejoin: boolean | null;
  suggestions: string | null;
  conductedAt: string | null;
}

export function useOffboardingTemplates() {
  return useQuery({
    queryKey: ['offboarding', 'templates'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: OffboardingTemplate[] }>('/offboarding/templates');
      return res.data.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateOffboardingTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      tasks: { title: string; description?: string; assignedRole: AssignedRole; dueBeforeDays: number; order: number }[];
    }) => {
      const res = await apiClient.post<{ data: OffboardingTemplate }>('/offboarding/templates', data);
      return res.data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['offboarding', 'templates'] }),
  });
}

export function useDeleteOffboardingTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/offboarding/templates/${id}`);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['offboarding', 'templates'] }),
  });
}

export function useOffboardingAssignments() {
  return useQuery({
    queryKey: ['offboarding', 'assignments'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: OffboardingAssignment[] }>('/offboarding/assignments');
      return res.data.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useOffboardingAssignment(id: string | null) {
  return useQuery({
    queryKey: ['offboarding', 'assignments', id],
    queryFn: async () => {
      const res = await apiClient.get<{ data: OffboardingAssignment }>(`/offboarding/assignments/${id!}`);
      return res.data.data;
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useCreateOffboardingAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { employeeId: string; templateId: string; lastWorkingDate: string; reason?: string }) => {
      const res = await apiClient.post<{ data: OffboardingAssignment }>('/offboarding/assignments', data);
      return res.data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['offboarding', 'assignments'] }),
  });
}

export function useUpdateOffboardingTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ assignmentId, taskId, status, notes }: { assignmentId: string; taskId: string; status: OffboardingTaskStatus; notes?: string }) => {
      const res = await apiClient.patch<{ data: OffboardingAssignmentTask }>(
        `/offboarding/assignments/${assignmentId}/tasks/${taskId}`,
        { status, ...(notes ? { notes } : {}) },
      );
      return res.data.data;
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ['offboarding', 'assignments', vars.assignmentId] });
      void qc.invalidateQueries({ queryKey: ['offboarding', 'assignments'] });
    },
  });
}

export function useExitInterview(assignmentId: string | null) {
  return useQuery({
    queryKey: ['offboarding', 'exit-interview', assignmentId],
    queryFn: async () => {
      const res = await apiClient.get<{ data: ExitInterview | null }>(`/offboarding/assignments/${assignmentId!}/exit-interview`);
      return res.data.data;
    },
    enabled: !!assignmentId,
    staleTime: 60 * 1000,
  });
}

export function useSubmitExitInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ assignmentId, ...data }: {
      assignmentId: string;
      reasonForLeaving?: string;
      overallRating?: number;
      managementRating?: number;
      workEnvironment?: number;
      growthOpportunities?: number;
      wouldRejoin?: boolean;
      suggestions?: string;
    }) => {
      const res = await apiClient.post<{ data: ExitInterview }>(`/offboarding/assignments/${assignmentId}/exit-interview`, data);
      return res.data.data;
    },
    onSuccess: (_d, vars) => void qc.invalidateQueries({ queryKey: ['offboarding', 'exit-interview', vars.assignmentId] }),
  });
}
