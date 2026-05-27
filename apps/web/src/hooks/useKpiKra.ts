import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

// ── Types ────────────────────────────────────────────────────────────────────

export type KPIUnit = 'PERCENTAGE' | 'NUMBER' | 'CURRENCY' | 'BOOLEAN';
export type KPIFrequency = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
export type KRAStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type KPIRecordStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'ACHIEVED' | 'MISSED' | 'PARTIAL';

export interface KPI {
  id: string;
  kraId: string;
  name: string;
  description?: string;
  unit: KPIUnit;
  targetValue?: number;
  frequency: KPIFrequency;
  isActive: boolean;
}

export interface KRA {
  id: string;
  name: string;
  description?: string;
  department?: string;
  isActive: boolean;
  kpis: KPI[];
  _count?: { assignments: number };
}

export interface KPIRecord {
  id: string;
  kpiId: string;
  kpi: KPI;
  targetValue?: number;
  actualValue?: number;
  achievementPct?: number;
  status: KPIRecordStatus;
  notes?: string;
  recordedAt?: string;
}

export interface KRAAssignment {
  id: string;
  employeeId: string;
  kraId: string;
  period: string;
  status: KRAStatus;
  overallScore?: number;
  notes?: string;
  employee?: any;
  kra: KRA;
  kpiRecords: KPIRecord[];
}

export interface KpiKraSummary {
  totalKRAs: number;
  totalAssignments: number;
  activeAssignments: number;
  completedAssignments: number;
}

// ── KRA Hooks ────────────────────────────────────────────────────────────────

export function useKRAs() {
  return useQuery<KRA[]>({
    queryKey: ['kras'],
    queryFn: async () => {
      const { data } = await api.get('/kpi-kra/kras');
      return data.data;
    },
  });
}

export function useCreateKRA() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<KRA>) => api.post('/kpi-kra/kras', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kras'] }),
  });
}

export function useUpdateKRA() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...rest }: Partial<KRA> & { id: string }) =>
      api.patch(`/kpi-kra/kras/${id}`, rest),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kras'] }),
  });
}

export function useDeleteKRA() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/kpi-kra/kras/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kras'] }),
  });
}

// ── KPI Hooks ────────────────────────────────────────────────────────────────

export function useCreateKPI() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ kraId, ...rest }: Partial<KPI> & { kraId: string }) =>
      api.post(`/kpi-kra/kras/${kraId}/kpis`, rest),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kras'] }),
  });
}

export function useUpdateKPI() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...rest }: Partial<KPI> & { id: string }) =>
      api.patch(`/kpi-kra/kpis/${id}`, rest),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kras'] }),
  });
}

export function useDeleteKPI() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/kpi-kra/kpis/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kras'] }),
  });
}

// ── Assignment Hooks ─────────────────────────────────────────────────────────

export function useKRAAssignments(employeeId?: string, period?: string) {
  return useQuery<KRAAssignment[]>({
    queryKey: ['kra-assignments', employeeId, period],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (employeeId) params.set('employeeId', employeeId);
      if (period) params.set('period', period);
      const { data } = await api.get(`/kpi-kra/assignments?${params}`);
      return data.data;
    },
  });
}

export function useAssignKRA() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      employeeId: string;
      kraId: string;
      period: string;
      cycleId?: string;
      notes?: string;
    }) => api.post('/kpi-kra/assignments', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kra-assignments'] }),
  });
}

export function useUpdateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...rest }: { id: string; status?: KRAStatus; notes?: string; overallScore?: number }) =>
      api.patch(`/kpi-kra/assignments/${id}`, rest),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kra-assignments'] }),
  });
}

export function useDeleteAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/kpi-kra/assignments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kra-assignments'] }),
  });
}

// ── KPI Record Hooks ─────────────────────────────────────────────────────────

export function useUpdateKPIRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...rest
    }: {
      id: string;
      actualValue?: number;
      targetValue?: number;
      status?: KPIRecordStatus;
      notes?: string;
    }) => api.patch(`/kpi-kra/records/${id}`, rest),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kra-assignments'] }),
  });
}

// ── Summary ──────────────────────────────────────────────────────────────────

export function useKpiKraSummary() {
  return useQuery<KpiKraSummary>({
    queryKey: ['kpi-kra-summary'],
    queryFn: async () => {
      const { data } = await api.get('/kpi-kra/summary');
      return data.data;
    },
  });
}
