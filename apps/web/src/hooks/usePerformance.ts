import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';

export type CycleFrequency = 'ANNUAL' | 'HALF_YEARLY' | 'QUARTERLY';
export type CycleStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED';
export type GoalStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'ACHIEVED' | 'MISSED';
export type ReviewStatus = 'PENDING' | 'SELF_SUBMITTED' | 'COMPLETED';

export interface PerformanceCycle {
  id: string;
  name: string;
  frequency: CycleFrequency;
  status: CycleStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
  _count?: { goals: number; reviews: number };
}

export interface PerformanceGoal {
  id: string;
  cycleId: string;
  employeeId: string;
  title: string;
  description: string | null;
  targetValue: string | null;
  status: GoalStatus;
  progress: number;
  dueDate: string | null;
  createdAt: string;
  employee?: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
}

export interface PerformanceReview {
  id: string;
  cycleId: string;
  employeeId: string;
  reviewerId: string;
  selfRating: number | null;
  selfComments: string | null;
  managerRating: number | null;
  managerComments: string | null;
  status: ReviewStatus;
  selfSubmittedAt: string | null;
  completedAt: string | null;
  employee?: { id: string; firstName: string; lastName: string; avatarUrl: string | null; designation: string | null };
  reviewer?: { id: string; firstName: string; lastName: string };
}

export interface PeerFeedback {
  id: string;
  cycleId: string;
  fromId: string;
  toId: string;
  rating: number | null;
  strengths: string | null;
  improvements: string | null;
  createdAt: string;
  from?: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
  to?: { id: string; firstName: string; lastName: string };
  cycle?: { id: string; name: string };
}

export function useCycles() {
  return useQuery({
    queryKey: ['performance', 'cycles'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: PerformanceCycle[] }>('/performance/cycles');
      return res.data.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; frequency: CycleFrequency; startDate: string; endDate: string }) => {
      const res = await apiClient.post<{ data: PerformanceCycle }>('/performance/cycles', data);
      return res.data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['performance', 'cycles'] }),
  });
}

export function useUpdateCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; status?: CycleStatus; name?: string }) => {
      await apiClient.patch(`/performance/cycles/${id}`, data);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['performance', 'cycles'] }),
  });
}

export function useGoals(cycleId: string | null) {
  return useQuery({
    queryKey: ['performance', 'goals', cycleId],
    queryFn: async () => {
      const res = await apiClient.get<{ data: PerformanceGoal[] }>(`/performance/cycles/${cycleId!}/goals`);
      return res.data.data;
    },
    enabled: !!cycleId,
    staleTime: 60 * 1000,
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { cycleId: string; title: string; description?: string; targetValue?: string; dueDate?: string }) => {
      const res = await apiClient.post<{ data: PerformanceGoal }>('/performance/goals', data);
      return res.data.data;
    },
    onSuccess: (_d, vars) => void qc.invalidateQueries({ queryKey: ['performance', 'goals', vars.cycleId] }),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, cycleId, ...data }: { id: string; cycleId: string; status?: GoalStatus; progress?: number; title?: string }) => {
      await apiClient.patch(`/performance/goals/${id}`, data);
      return cycleId;
    },
    onSuccess: (cycleId) => void qc.invalidateQueries({ queryKey: ['performance', 'goals', cycleId] }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, cycleId }: { id: string; cycleId: string }) => {
      await apiClient.delete(`/performance/goals/${id}`);
      return cycleId;
    },
    onSuccess: (cycleId) => void qc.invalidateQueries({ queryKey: ['performance', 'goals', cycleId] }),
  });
}

export function useReviews(cycleId: string | null) {
  return useQuery({
    queryKey: ['performance', 'reviews', cycleId],
    queryFn: async () => {
      const res = await apiClient.get<{ data: PerformanceReview[] }>(`/performance/cycles/${cycleId!}/reviews`);
      return res.data.data;
    },
    enabled: !!cycleId,
    staleTime: 60 * 1000,
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ cycleId, employeeId, reviewerId }: { cycleId: string; employeeId: string; reviewerId: string }) => {
      const res = await apiClient.post<{ data: PerformanceReview }>(`/performance/cycles/${cycleId}/reviews`, { employeeId, reviewerId });
      return res.data.data;
    },
    onSuccess: (_d, vars) => void qc.invalidateQueries({ queryKey: ['performance', 'reviews', vars.cycleId] }),
  });
}

export function useSubmitSelfReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ reviewId, selfRating, selfComments }: { reviewId: string; cycleId: string; selfRating: number; selfComments?: string }) => {
      await apiClient.patch(`/performance/reviews/${reviewId}/self`, { selfRating, selfComments });
    },
    onSuccess: (_d, vars) => void qc.invalidateQueries({ queryKey: ['performance', 'reviews', vars.cycleId] }),
  });
}

export function useSubmitManagerReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ reviewId, managerRating, managerComments }: { reviewId: string; cycleId: string; managerRating: number; managerComments?: string }) => {
      await apiClient.patch(`/performance/reviews/${reviewId}/manager`, { managerRating, managerComments });
    },
    onSuccess: (_d, vars) => void qc.invalidateQueries({ queryKey: ['performance', 'reviews', vars.cycleId] }),
  });
}

export function usePeerFeedbacks(cycleId: string | null) {
  return useQuery({
    queryKey: ['performance', 'peer-feedback', cycleId],
    queryFn: async () => {
      const res = await apiClient.get<{ data: PeerFeedback[] }>('/performance/peer-feedback', {
        params: cycleId ? { cycleId } : {},
      });
      return res.data.data;
    },
    enabled: !!cycleId,
    staleTime: 60 * 1000,
  });
}

export function useSubmitPeerFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { cycleId: string; toId: string; rating?: number; strengths?: string; improvements?: string }) => {
      const res = await apiClient.post<{ data: PeerFeedback }>('/performance/peer-feedback', data);
      return res.data.data;
    },
    onSuccess: (_d, vars) => void qc.invalidateQueries({ queryKey: ['performance', 'peer-feedback', vars.cycleId] }),
  });
}
