import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => apiClient.get('/projects').then((r) => r.data.data),
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/projects', data).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); toast.success('Project created'); },
    onError: () => toast.error('Failed to create project'),
  });
}

export function useTimesheetEntries(weekStart?: string) {
  return useQuery({
    queryKey: ['timesheet-entries', weekStart],
    queryFn: () =>
      apiClient.get('/timesheet/entries', { params: weekStart ? { weekStart } : {} }).then((r) => r.data.data),
  });
}

export function useUpsertTimesheetEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/timesheet/entries', data).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['timesheet-entries'] }); },
    onError: () => toast.error('Failed to save entry'),
  });
}

export function useSubmitTimesheetWeek() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (weekStart: string) => apiClient.post('/timesheet/submit', { weekStart }).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['timesheet-entries'] }); toast.success('Timesheet submitted'); },
    onError: () => toast.error('Failed to submit timesheet'),
  });
}

export function useAllTimesheets() {
  return useQuery({
    queryKey: ['timesheets-all'],
    queryFn: () => apiClient.get('/timesheet/all').then((r) => r.data.data),
  });
}

export function useApproveTimesheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, weekStart }: { employeeId: string; weekStart: string }) =>
      apiClient.patch('/timesheet/approve', { employeeId, weekStart }).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['timesheets-all'] }); toast.success('Timesheet approved'); },
    onError: () => toast.error('Failed to approve'),
  });
}
