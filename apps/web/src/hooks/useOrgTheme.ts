import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@hrms/shared-types';
import { applyOrgTheme } from '@/lib/theme-engine';

export interface OrgThemeConfig {
  id: string;
  primaryColor?: string | null;
  primaryForeground?: string | null;
  sidebarStyle: string;
  bgImageUrl?: string | null;
  backgroundColor?: string | null;
  cardColor?: string | null;
  appliedAt: string;
}

export interface OrgThemeRequest {
  id: string;
  preferredPrimaryHex?: string | null;
  sidebarStyle?: string | null;
  wantsBgImage: boolean;
  bgImageUrl?: string | null;
  backgroundColor?: string | null;
  logoUrl?: string | null;
  notes?: string | null;
  attachmentUrls: string[];
  status: string;
  superAdminNote?: string | null;
  createdAt: string;
  requestedBy: { firstName: string; lastName: string };
}

export interface OrgThemeData {
  themeConfig: OrgThemeConfig | null;
  pendingRequest: OrgThemeRequest | null;
}

export interface OrgThemeRequestInput {
  preferredPrimaryHex?: string;
  sidebarStyle?: 'light' | 'dark' | 'branded';
  wantsBgImage?: boolean;
  bgImageUrl?: string;
  backgroundColor?: string;
  logoUrl?: string;
  notes?: string;
  attachmentUrls?: string[];
}

const KEY = ['org', 'theme'] as const;

export function useOrgTheme() {
  const query = useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<OrgThemeData>>('/org/theme');
      return res.data.data;
    },
  });

  // Apply theme whenever the config changes
  useEffect(() => {
    if (query.data) {
      applyOrgTheme(query.data.themeConfig);
    }
  }, [query.data]);

  return query;
}

export function useRequestOrgTheme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: OrgThemeRequestInput) => {
      const res = await apiClient.post<ApiResponse<unknown>>('/org/theme/request', input);
      return res.data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      toast.success('Theme request submitted! The platform administrator will review it shortly.');
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err.response?.data?.error ?? 'Failed to submit theme request');
    },
  });
}
