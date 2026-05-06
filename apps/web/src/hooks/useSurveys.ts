import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';

export type SurveyStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED';
export type QuestionType = 'RATING_5' | 'RATING_10' | 'TEXT' | 'MULTIPLE_CHOICE';

export interface SurveyQuestion {
  id: string;
  surveyId: string;
  questionText: string;
  questionType: QuestionType;
  options: string[] | null;
  isRequired: boolean;
  displayOrder: number;
}

export interface SurveySummary {
  id: string;
  title: string;
  description: string | null;
  status: SurveyStatus;
  isAnonymous: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  hasResponded: boolean;
  _count: { questions: number; responses: number };
}

export interface SurveyDetail extends Omit<SurveySummary, '_count'> {
  questions: SurveyQuestion[];
  hasResponded: boolean;
}

export interface SurveyResults {
  surveyId: string;
  totalResponses: number;
  questions: Array<{
    questionId: string;
    questionText: string;
    questionType: QuestionType;
    avg?: number | null;
    count?: number;
    responses?: (string | null)[];
  }>;
}

export interface CreateSurveyInput {
  title: string;
  description?: string;
  isAnonymous: boolean;
  questions: Array<{
    questionText: string;
    questionType: QuestionType;
    options?: string[];
    isRequired: boolean;
    displayOrder: number;
  }>;
}

export interface SubmitAnswersInput {
  answers: Array<{
    questionId: string;
    ratingValue?: number;
    textValue?: string;
  }>;
}

export function useSurveys() {
  return useQuery({
    queryKey: ['surveys'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: SurveySummary[] }>('/surveys');
      return res.data.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useSurveyDetail(id: string | null) {
  return useQuery({
    queryKey: ['surveys', id],
    queryFn: async () => {
      const res = await apiClient.get<{ data: SurveyDetail }>(`/surveys/${id!}`);
      return res.data.data;
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useSurveyResults(id: string | null) {
  return useQuery({
    queryKey: ['surveys', id, 'results'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: SurveyResults }>(`/surveys/${id!}/results`);
      return res.data.data;
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useCreateSurvey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateSurveyInput) => {
      const res = await apiClient.post<{ data: SurveyDetail }>('/surveys', data);
      return res.data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['surveys'] }),
  });
}

export function useUpdateSurveyStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: SurveyStatus }) => {
      await apiClient.patch(`/surveys/${id}/status`, { status });
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['surveys'] }),
  });
}

export function useSubmitSurveyResponse(surveyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: SubmitAnswersInput) => {
      await apiClient.post(`/surveys/${surveyId}/respond`, data);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['surveys'] }),
  });
}
