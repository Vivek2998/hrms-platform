import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';

export type ApplicationStage = 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED';
export type JobStatus = 'OPEN' | 'FILLED' | 'CLOSED';

export interface JobPosting {
  id: string;
  title: string;
  departmentId: string | null;
  location: string | null;
  employmentType: string;
  description: string;
  requirements: string | null;
  minSalary: number | null;
  maxSalary: number | null;
  openings: number;
  status: JobStatus;
  postedBy: string;
  closingDate: string | null;
  createdAt: string;
  _count?: { applications: number };
}

export interface JobApplication {
  id: string;
  jobId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string | null;
  resumeUrl: string | null;
  stage: ApplicationStage;
  source: string | null;
  notes: string | null;
  rejectionReason: string | null;
  createdAt: string;
  job?: { id: string; title: string };
  _count?: { interviews: number };
}

export interface InterviewSchedule {
  id: string;
  applicationId: string;
  interviewerIds: string[];
  scheduledAt: string;
  durationMinutes: number;
  mode: string;
  meetingLink: string | null;
  venue: string | null;
  round: number;
  status: string;
  feedback: string | null;
  rating: number | null;
}

export function useJobs(status?: JobStatus) {
  return useQuery({
    queryKey: ['recruitment', 'jobs', status],
    queryFn: async () => {
      const res = await apiClient.get<{ data: JobPosting[] }>('/recruitment/jobs', { params: status ? { status } : {} });
      return res.data.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<JobPosting, 'id' | 'status' | 'postedBy' | 'createdAt' | '_count'>) => {
      const res = await apiClient.post<{ data: JobPosting }>('/recruitment/jobs', data);
      return res.data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['recruitment', 'jobs'] }),
  });
}

export function useUpdateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<JobPosting> & { id: string }) => {
      await apiClient.patch(`/recruitment/jobs/${id}`, data);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['recruitment', 'jobs'] }),
  });
}

export function useDeleteJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/recruitment/jobs/${id}`);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['recruitment', 'jobs'] }),
  });
}

export function useApplications(jobId?: string, stage?: ApplicationStage) {
  return useQuery({
    queryKey: ['recruitment', 'applications', jobId, stage],
    queryFn: async () => {
      const res = await apiClient.get<{ data: JobApplication[] }>('/recruitment/applications', {
        params: { ...(jobId ? { jobId } : {}), ...(stage ? { stage } : {}) },
      });
      return res.data.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useApply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ jobId, ...data }: { jobId: string; candidateName: string; candidateEmail: string; candidatePhone?: string; resumeUrl?: string; coverLetter?: string; source?: string }) => {
      const res = await apiClient.post<{ data: JobApplication }>(`/recruitment/jobs/${jobId}/apply`, data);
      return res.data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['recruitment', 'applications'] }),
  });
}

export function useUpdateApplicationStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, stage, notes, rejectionReason }: { id: string; stage: ApplicationStage; notes?: string; rejectionReason?: string }) => {
      await apiClient.patch(`/recruitment/applications/${id}/stage`, { stage, notes, rejectionReason });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['recruitment', 'applications'] });
      void qc.invalidateQueries({ queryKey: ['recruitment', 'jobs'] });
    },
  });
}

export function useInterviews(applicationId: string | null) {
  return useQuery({
    queryKey: ['recruitment', 'interviews', applicationId],
    queryFn: async () => {
      const res = await apiClient.get<{ data: InterviewSchedule[] }>(`/recruitment/applications/${applicationId!}/interviews`);
      return res.data.data;
    },
    enabled: !!applicationId,
    staleTime: 60 * 1000,
  });
}

export function useScheduleInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ applicationId, ...data }: { applicationId: string; interviewerIds: string[]; scheduledAt: string; durationMinutes?: number; mode?: string; meetingLink?: string; round?: number }) => {
      const res = await apiClient.post<{ data: InterviewSchedule }>(`/recruitment/applications/${applicationId}/interviews`, data);
      return res.data.data;
    },
    onSuccess: (_d, vars) => void qc.invalidateQueries({ queryKey: ['recruitment', 'interviews', vars.applicationId] }),
  });
}

export function useUpdateInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; applicationId: string; status?: string; feedback?: string; rating?: number }) => {
      await apiClient.patch(`/recruitment/interviews/${id}`, data);
      return data.applicationId;
    },
    onSuccess: (applicationId) => void qc.invalidateQueries({ queryKey: ['recruitment', 'interviews', applicationId] }),
  });
}
