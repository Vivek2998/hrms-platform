import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';

export interface AnalyticsOverview {
  totalActive: number;
  totalInactive: number;
  newThisMonth: number;
  termThisMonth: number;
  attritionRate: number;
}

export interface HeadcountPoint { month: string; count: number }
export interface DepartmentPoint { department: string; count: number }
export interface AttendancePoint { status: string; count: number }
export interface LeavePoint { name: string; color: string; allocated: number; used: number }
export interface PayrollPoint { month: string; netPay: number; gross: number; deductions: number; employees: number }

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: AnalyticsOverview }>('/analytics/overview');
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useHeadcountTrend() {
  return useQuery({
    queryKey: ['analytics', 'headcount-trend'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: HeadcountPoint[] }>('/analytics/headcount-trend');
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useDepartmentBreakdown() {
  return useQuery({
    queryKey: ['analytics', 'department-breakdown'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: DepartmentPoint[] }>('/analytics/department-breakdown');
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAttendanceSummary() {
  return useQuery({
    queryKey: ['analytics', 'attendance-summary'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: AttendancePoint[] }>('/analytics/attendance-summary');
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useLeaveUtilization() {
  return useQuery({
    queryKey: ['analytics', 'leave-utilization'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: LeavePoint[] }>('/analytics/leave-utilization');
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePayrollTrend() {
  return useQuery({
    queryKey: ['analytics', 'payroll-trend'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: PayrollPoint[] }>('/analytics/payroll-trend');
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
