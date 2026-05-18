import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';

export type AssignedRole = 'HR' | 'IT' | 'FINANCE' | 'MANAGER' | 'EMPLOYEE';
export type TaskStatus = 'PENDING' | 'COMPLETED' | 'SKIPPED';
export type AssignmentStatus = 'IN_PROGRESS' | 'COMPLETED';

export interface OnboardingTaskDef {
  id: string;
  templateId: string;
  title: string;
  description: string | null;
  assignedRole: AssignedRole;
  dueAfterDays: number;
  isRequired: boolean;
  displayOrder: number;
}

export interface OnboardingTemplate {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: { tasks: number; assignments: number };
  tasks?: OnboardingTaskDef[];
}

export interface AssignmentTask {
  id: string;
  assignmentId: string;
  taskId: string;
  title: string;
  assignedRole: AssignedRole;
  status: TaskStatus;
  dueDate: string | null;
  completedAt: string | null;
  notes: string | null;
}

export interface OnboardingAssignment {
  id: string;
  employeeId: string;
  templateId: string;
  status: AssignmentStatus;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  completedTasks?: number;
  employee: { id: string; firstName: string; lastName: string; designation?: string | null; avatarUrl?: string | null };
  template: { id: string; name: string };
  _count?: { tasks: number };
  tasks?: AssignmentTask[];
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  tasks: Array<{
    title: string;
    description?: string;
    assignedRole: AssignedRole;
    dueAfterDays: number;
    isRequired: boolean;
    displayOrder: number;
  }>;
}

export function useOnboardingTemplates({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['onboarding', 'templates'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: OnboardingTemplate[] }>('/onboarding/templates');
      return res.data.data;
    },
    staleTime: 2 * 60 * 1000,
    enabled,
  });
}

export function useOnboardingTemplate(id: string | null) {
  return useQuery({
    queryKey: ['onboarding', 'templates', id],
    queryFn: async () => {
      const res = await apiClient.get<{ data: OnboardingTemplate }>(`/onboarding/templates/${id!}`);
      return res.data.data;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateOnboardingTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTemplateInput) => {
      const res = await apiClient.post<{ data: OnboardingTemplate }>('/onboarding/templates', data);
      return res.data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['onboarding', 'templates'] }),
  });
}

export function useDeleteOnboardingTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/onboarding/templates/${id}`);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['onboarding', 'templates'] }),
  });
}

export function useOnboardingAssignments() {
  return useQuery({
    queryKey: ['onboarding', 'assignments'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: OnboardingAssignment[] }>('/onboarding/assignments');
      return res.data.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useOnboardingAssignment(id: string | null) {
  return useQuery({
    queryKey: ['onboarding', 'assignments', id],
    queryFn: async () => {
      const res = await apiClient.get<{ data: OnboardingAssignment }>(`/onboarding/assignments/${id!}`);
      return res.data.data;
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useCreateOnboardingAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { employeeId: string; templateId: string }) => {
      const res = await apiClient.post<{ data: OnboardingAssignment }>('/onboarding/assignments', data);
      return res.data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['onboarding', 'assignments'] }),
  });
}

export function useUpdateOnboardingTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      assignmentId,
      taskId,
      status,
      notes,
    }: {
      assignmentId: string;
      taskId: string;
      status: TaskStatus;
      notes?: string;
    }) => {
      const res = await apiClient.patch<{ data: AssignmentTask }>(
        `/onboarding/assignments/${assignmentId}/tasks/${taskId}`,
        { status, ...(notes ? { notes } : {}) },
      );
      return res.data.data;
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ['onboarding', 'assignments', vars.assignmentId] });
      void qc.invalidateQueries({ queryKey: ['onboarding', 'assignments'] });
    },
  });
}
