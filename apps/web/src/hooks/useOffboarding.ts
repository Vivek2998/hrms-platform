import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';

export type OffboardingTaskStatus = 'PENDING' | 'COMPLETED' | 'SKIPPED';
export type OffboardingStatus = 'IN_PROGRESS' | 'COMPLETED';
export type AssignedRole = 'HR' | 'IT' | 'FINANCE' | 'MANAGER' | 'EMPLOYEE';

export interface OffboardingTaskDef {
  id: string;
  templateId: string;
  title: string;
  description: string | null;
  assignedRole: AssignedRole;
  dueBeforeDays: number;
  isRequired: boolean;
  displayOrder: number;
}

export interface OffboardingTemplate {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: { tasks: number; assignments: number };
  tasks?: OffboardingTaskDef[];
}

export interface OffboardingAssignmentTask {
  id: string;
  assignmentId: string;
  taskId: string;
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
  templateId: string;
  lastWorkingDate: string;
  status: OffboardingStatus;
  completedAt: string | null;
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
  employeeId: string;
  reasonForLeaving: string | null;
  jobSatisfaction: number | null;
  managementRating: number | null;
  workEnvRating: number | null;
  compensationRating: number | null;
  wouldRecommend: boolean | null;
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
    mutationFn: async (data: { name: string; description?: string; tasks: Omit<OffboardingTaskDef, 'id' | 'templateId'>[] }) => {
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
    mutationFn: async (data: { employeeId: string; templateId: string; lastWorkingDate: string }) => {
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
    mutationFn: async ({ assignmentId, ...data }: { assignmentId: string; reasonForLeaving?: string; jobSatisfaction?: number; managementRating?: number; workEnvRating?: number; compensationRating?: number; wouldRecommend?: boolean; suggestions?: string }) => {
      const res = await apiClient.post<{ data: ExitInterview }>(`/offboarding/assignments/${assignmentId}/exit-interview`, data);
      return res.data.data;
    },
    onSuccess: (_d, vars) => void qc.invalidateQueries({ queryKey: ['offboarding', 'exit-interview', vars.assignmentId] }),
  });
}
