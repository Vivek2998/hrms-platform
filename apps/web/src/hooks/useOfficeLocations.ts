import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@hrms/shared-types';

export interface OfficeLocation {
  id: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  isActive: boolean;
  _count?: { employees: number };
}

interface LocationPayload {
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  isActive?: boolean;
}

const keys = {
  all: ['office-locations'] as const,
  list: () => ['office-locations', 'list'] as const,
};

export function useOfficeLocations() {
  return useQuery({
    queryKey: keys.list(),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<OfficeLocation[]>>('/office-locations');
      return res.data.data;
    },
  });
}

export function useCreateOfficeLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: LocationPayload) => {
      const res = await apiClient.post<ApiResponse<OfficeLocation>>('/office-locations', data);
      return res.data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.all });
      toast.success('Office location created');
    },
  });
}

export function useUpdateOfficeLocation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<LocationPayload>) => {
      const res = await apiClient.patch<ApiResponse<OfficeLocation>>(`/office-locations/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.all });
      toast.success('Office location updated');
    },
  });
}

export function useDeleteOfficeLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/office-locations/${id}`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.all });
      toast.success('Office location deleted');
    },
  });
}

export function useAssignEmployeeLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, locationId }: { employeeId: string; locationId: string | null }) => {
      await apiClient.patch(`/office-locations/assign/${employeeId}`, { locationId });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.all });
      void qc.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}
