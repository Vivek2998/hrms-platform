import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@/lib/axios';

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
  weightage: number;
  dueDate: string | null;
  createdAt: string;
  employee?: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
}

export interface PerformanceReview {
  id: string;
  cycleId: string;
  employeeId: string;
  reviewerId: string | null;
  selfRating: number | null;
  selfComments: string | null;
  managerRating: number | null;
  managerComments: string | null;
  finalRating: number | null;
  status: ReviewStatus;
  selfSubmittedAt: string | null;
  managerSubmittedAt: string | null;
  employee?: {
    id: string; firstName: string; lastName: string;
    avatarUrl: string | null; designation: string | null;
    employeeCode?: string;
    department?: { name: string } | null;
  };
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

export interface EmployeePerfSummary {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    designation: string | null;
    avatarUrl: string | null;
    employeeCode: string;
    department: { name: string } | null;
  };
  totalGoals: number;
  achievedGoals: number;
  weightedProgress: number;
  review: {
    status: ReviewStatus;
    selfRating: number | null;
    managerRating: number | null;
    finalRating: number | null;
    reviewer: { firstName: string; lastName: string } | null;
  } | null;
  peerFeedbackCount: number;
  avgPeerRating: number | null;
}

// ── Cycles ───────────────────────────────────────────────────

export function useCycles() {
  return useQuery({
    queryKey: ['performance', 'cycles'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<PerformanceCycle[]>>('/performance/cycles');
      return res.data.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; frequency: CycleFrequency; startDate: string; endDate: string }) => {
      const res = await apiClient.post<ApiResponse<PerformanceCycle>>('/performance/cycles', data);
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

// ── Team Overview ─────────────────────────────────────────────

export function useTeamOverview(cycleId: string | null) {
  return useQuery({
    queryKey: ['performance', 'team-overview', cycleId],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<EmployeePerfSummary[]>>(
        `/performance/cycles/${cycleId!}/team-overview`,
      );
      return res.data.data;
    },
    enabled: !!cycleId,
    staleTime: 60 * 1000,
  });
}

export function useInitializeReviews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cycleId: string) => {
      const res = await apiClient.post<ApiResponse<{ created: number; skipped: number; total: number }>>(
        `/performance/cycles/${cycleId}/initialize-reviews`,
        {},
      );
      return res.data.data;
    },
    onSuccess: (_d, cycleId) => {
      void qc.invalidateQueries({ queryKey: ['performance', 'reviews', cycleId] });
      void qc.invalidateQueries({ queryKey: ['performance', 'team-overview', cycleId] });
      void qc.invalidateQueries({ queryKey: ['performance', 'cycles'] });
    },
  });
}

// ── Goals ─────────────────────────────────────────────────────

export function useGoals(cycleId: string | null, employeeId?: string) {
  return useQuery({
    queryKey: ['performance', 'goals', cycleId, employeeId],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<PerformanceGoal[]>>(
        `/performance/cycles/${cycleId!}/goals`,
        { params: employeeId ? { employeeId } : {} },
      );
      return res.data.data;
    },
    enabled: !!cycleId,
    staleTime: 60 * 1000,
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      cycleId: string;
      employeeId?: string;
      title: string;
      description?: string;
      targetValue?: string;
      weightage?: number;
      dueDate?: string;
    }) => {
      const res = await apiClient.post<ApiResponse<PerformanceGoal>>('/performance/goals', data);
      return res.data.data;
    },
    onSuccess: (_d, vars) => void qc.invalidateQueries({ queryKey: ['performance', 'goals', vars.cycleId] }),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      cycleId,
      ...data
    }: {
      id: string;
      cycleId: string;
      status?: GoalStatus;
      progress?: number;
      title?: string;
      description?: string;
      targetValue?: string;
      weightage?: number;
    }) => {
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

// ── Reviews ───────────────────────────────────────────────────

export function useReviews(cycleId: string | null) {
  return useQuery({
    queryKey: ['performance', 'reviews', cycleId],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<PerformanceReview[]>>(
        `/performance/cycles/${cycleId!}/reviews`,
      );
      return res.data.data;
    },
    enabled: !!cycleId,
    staleTime: 60 * 1000,
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      cycleId,
      employeeId,
      reviewerId,
    }: {
      cycleId: string;
      employeeId: string;
      reviewerId: string;
    }) => {
      const res = await apiClient.post<ApiResponse<PerformanceReview>>(
        `/performance/cycles/${cycleId}/reviews`,
        { employeeId, reviewerId },
      );
      return res.data.data;
    },
    onSuccess: (_d, vars) => void qc.invalidateQueries({ queryKey: ['performance', 'reviews', vars.cycleId] }),
  });
}

export function useSubmitSelfReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      reviewId,
      selfRating,
      selfComments,
    }: {
      reviewId: string;
      cycleId: string;
      selfRating: number;
      selfComments?: string;
    }) => {
      await apiClient.patch(`/performance/reviews/${reviewId}/self`, { selfRating, selfComments });
    },
    onSuccess: (_d, vars) =>
      void qc.invalidateQueries({ queryKey: ['performance', 'reviews', vars.cycleId] }),
  });
}

export function useSubmitManagerReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      reviewId,
      managerRating,
      managerComments,
      finalRating,
    }: {
      reviewId: string;
      cycleId: string;
      managerRating: number;
      managerComments?: string;
      finalRating?: number;
    }) => {
      await apiClient.patch(`/performance/reviews/${reviewId}/manager`, {
        managerRating,
        managerComments,
        finalRating,
      });
    },
    onSuccess: (_d, vars) =>
      void qc.invalidateQueries({ queryKey: ['performance', 'reviews', vars.cycleId] }),
  });
}

// ── Peer Feedback ─────────────────────────────────────────────

export function usePeerFeedbacks(cycleId: string | null, employeeId?: string) {
  return useQuery({
    queryKey: ['performance', 'peer-feedback', cycleId, employeeId],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<PeerFeedback[]>>('/performance/peer-feedback', {
        params: {
          ...(cycleId ? { cycleId } : {}),
          ...(employeeId ? { employeeId } : {}),
        },
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
    mutationFn: async (data: {
      cycleId: string;
      toId: string;
      rating?: number;
      strengths?: string;
      improvements?: string;
    }) => {
      const res = await apiClient.post<ApiResponse<PeerFeedback>>('/performance/peer-feedback', data);
      return res.data.data;
    },
    onSuccess: (_d, vars) =>
      void qc.invalidateQueries({ queryKey: ['performance', 'peer-feedback', vars.cycleId] }),
  });
}

// ── Helpers ───────────────────────────────────────────────────

export type PerformanceLabel =
  | 'Outstanding'
  | 'Exceeds Expectations'
  | 'Meets Expectations'
  | 'Needs Improvement'
  | 'Below Expectations';

export function ratingLabel(score: number): PerformanceLabel {
  if (score >= 4.5) return 'Outstanding';
  if (score >= 4.0) return 'Exceeds Expectations';
  if (score >= 3.0) return 'Meets Expectations';
  if (score >= 2.0) return 'Needs Improvement';
  return 'Below Expectations';
}

export function ratingColor(score: number): string {
  if (score >= 4.5) return 'text-purple-700 bg-purple-100';
  if (score >= 4.0) return 'text-green-700 bg-green-100';
  if (score >= 3.0) return 'text-blue-700 bg-blue-100';
  if (score >= 2.0) return 'text-orange-700 bg-orange-100';
  return 'text-red-700 bg-red-100';
}

/** Compute a weighted overall performance score (0–5) */
export function computeOverallScore(
  review: PerformanceReview | null,
  weightedGoalProgress: number,
  avgPeerRating: number | null,
): number | null {
  if (!review) return null;
  if (review.finalRating) return review.finalRating;

  const parts: Array<{ value: number; weight: number }> = [];

  const ratingSource = review.managerRating ?? review.selfRating;
  if (ratingSource) parts.push({ value: ratingSource, weight: 0.55 });

  if (weightedGoalProgress > 0)
    parts.push({ value: weightedGoalProgress / 20, weight: 0.3 }); // 0-100% → 0-5

  if (avgPeerRating) parts.push({ value: avgPeerRating, weight: 0.15 });

  if (parts.length === 0) return null;
  const totalWeight = parts.reduce((s, p) => s + p.weight, 0);
  return Math.round((parts.reduce((s, p) => s + p.value * p.weight, 0) / totalWeight) * 10) / 10;
}
