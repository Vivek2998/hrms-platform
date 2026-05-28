import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';
import { format } from 'date-fns';

// ── Projects ─────────────────────────────────────────────────────────────────

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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created');
    },
    onError: () => toast.error('Failed to create project'),
  });
}

// ── Timesheet Entries ─────────────────────────────────────────────────────────

/** Fetch entries for the current user (or all entries for HR) for a given week. */
export function useTimesheetEntries(weekStart?: string) {
  return useQuery({
    queryKey: ['timesheet-entries', weekStart],
    queryFn: () =>
      apiClient
        .get('/timesheets', { params: weekStart ? { weekStart } : {} })
        .then((r) => r.data.data),
  });
}

/**
 * Upsert (create-or-update) an entry for a specific project+date.
 * Uses PUT /timesheets/upsert so editing a cell updates the existing row
 * instead of creating a duplicate.
 */
export function useUpsertTimesheetEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiClient.put('/timesheets/upsert', data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timesheet-entries'] });
    },
    onError: () => toast.error('Failed to save entry'),
  });
}

/** Submit all DRAFT entries for a given week. */
export function useSubmitTimesheetWeek() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (weekStart: string) =>
      apiClient
        .post('/timesheets/submit-week', { weekStartDate: weekStart })
        .then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timesheet-entries'] });
      toast.success('Timesheet submitted');
    },
    onError: () => toast.error('Failed to submit timesheet'),
  });
}

/**
 * Fetch all SUBMITTED timesheets for HR review.
 * The backend returns individual entries; we group them here by employee + week
 * so the UI can show one row per employee-week with a total hours figure.
 */
export function useAllTimesheets() {
  return useQuery({
    queryKey: ['timesheets-all'],
    queryFn: async () => {
      const entries: any[] = await apiClient
        .get('/timesheets', { params: { status: 'SUBMITTED' } })
        .then((r) => r.data.data);

      // Group by employeeId :: weekStart
      const groups: Record<string, any> = {};
      for (const e of entries) {
        const weekLabel = format(new Date(e.weekStart), 'yyyy-MM-dd');
        const key = `${e.employeeId}::${weekLabel}`;
        if (!groups[key]) {
          groups[key] = {
            employeeId: e.employeeId,
            employee: e.employee,
            weekStart: weekLabel,
            totalHours: 0,
            status: e.status,
          };
        }
        groups[key].totalHours += e.hours;
      }
      return Object.values(groups);
    },
  });
}

/** Bulk-approve all SUBMITTED entries for an employee's week. */
export function useApproveTimesheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, weekStart }: { employeeId: string; weekStart: string }) =>
      apiClient
        .patch('/timesheets/approve-week', { employeeId, weekStartDate: weekStart })
        .then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timesheets-all'] });
      toast.success('Timesheet approved');
    },
    onError: () => toast.error('Failed to approve'),
  });
}
