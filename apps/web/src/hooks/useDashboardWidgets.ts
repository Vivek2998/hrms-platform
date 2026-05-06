import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@hrms/shared-types';

interface WidgetEmployee {
  id: string;
  firstName: string;
  lastName: string;
  designation?: string | null;
  avatarUrl?: string | null;
}

export interface BirthdayEntry extends WidgetEmployee {
  dateOfBirth: string;
}

export interface NewJoineeEntry extends WidgetEmployee {
  dateOfJoining: string;
}

export interface AnniversaryEntry extends WidgetEmployee {
  dateOfJoining: string;
  years: number;
}

export interface MyLeaveEntry {
  id: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  status: string;
  createdAt: string;
  leaveType: { name: string; code: string };
}

export interface MyRegularisationEntry {
  id: string;
  date: string;
  requestedIn?: string | null;
  requestedOut?: string | null;
  status: string;
  createdAt: string;
}

export interface MyCompOffEntry {
  id: string;
  workedDate: string;
  status: string;
  createdAt: string;
}

export interface DashboardWidgets {
  birthdays: BirthdayEntry[];
  newJoinees: NewJoineeEntry[];
  workAnniversaries: AnniversaryEntry[];
  myPendingRequests: {
    leaves: MyLeaveEntry[];
    regularisations: MyRegularisationEntry[];
    compOffs: MyCompOffEntry[];
  } | null;
}

export function useDashboardWidgets() {
  return useQuery({
    queryKey: ['dashboard', 'widgets'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<DashboardWidgets>>('/dashboard/widgets');
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
