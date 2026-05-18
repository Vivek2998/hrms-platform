import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';
import type { ApiResponse, LearningCourse, CourseEnrollment, CourseLevel } from '@hrms/shared-types';

export function useLmsCourses(params?: { category?: string; level?: CourseLevel; search?: string }) {
  return useQuery({
    queryKey: ['lms', 'courses', params],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<LearningCourse[]>>('/lms/courses', { params });
      return res.data.data;
    },
  });
}

export function useMyLmsCourses() {
  return useQuery({
    queryKey: ['lms', 'my-courses'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<CourseEnrollment[]>>('/lms/my-courses');
      return res.data.data;
    },
  });
}

export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string;
      description?: string;
      thumbnailUrl?: string;
      category?: string;
      level?: CourseLevel;
      durationMinutes?: number;
      tags?: string[];
      externalUrl?: string;
    }) => apiClient.post('/lms/courses', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lms'] });
      toast.success('Course created');
    },
    onError: () => toast.error('Failed to create course'),
  });
}

export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/lms/courses/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lms'] });
      toast.success('Course deleted');
    },
    onError: () => toast.error('Failed to delete'),
  });
}

export function useEnrollCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => apiClient.post(`/lms/courses/${courseId}/enroll`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lms'] });
      toast.success('Enrolled successfully');
    },
    onError: () => toast.error('Failed to enroll'),
  });
}

export function useUpdateProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, progressPct }: { courseId: string; progressPct: number }) =>
      apiClient.patch(`/lms/courses/${courseId}/progress`, { progressPct }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lms'] }),
    onError: () => toast.error('Failed to update progress'),
  });
}
