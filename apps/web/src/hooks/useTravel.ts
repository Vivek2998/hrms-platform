import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';

export type TravelStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type TravelMode = 'FLIGHT' | 'TRAIN' | 'BUS' | 'CAR' | 'OTHER';

export interface TravelEmployee {
  id: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
  avatarUrl: string | null;
}

export interface TravelRequest {
  id: string;
  employeeId: string;
  purpose: string;
  fromCity: string;
  toCity: string;
  departureDate: string;
  returnDate: string | null;
  travelMode: TravelMode;
  estimatedBudget: number | null;
  hotelRequired: boolean;
  advanceRequired: boolean;
  advanceAmount: number | null;
  status: TravelStatus;
  approvedAt: string | null;
  rejectedReason: string | null;
  notes: string | null;
  createdAt: string;
  employee: TravelEmployee;
  approvedBy: { id: string; firstName: string; lastName: string } | null;
}

export interface CreateTravelInput {
  purpose: string;
  fromCity: string;
  toCity: string;
  departureDate: string;
  returnDate?: string;
  travelMode?: TravelMode;
  estimatedBudget?: number;
  hotelRequired?: boolean;
  advanceRequired?: boolean;
  advanceAmount?: number;
  notes?: string;
}

export function useTravelRequests() {
  return useQuery<TravelRequest[]>({
    queryKey: ['travel'],
    queryFn: async () => {
      const res = await apiClient.get('/travel');
      return res.data.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateTravelRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTravelInput) => apiClient.post('/travel', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['travel'] }),
  });
}

export function useApproveTravelRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.patch(`/travel/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['travel'] }),
  });
}

export function useRejectTravelRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiClient.patch(`/travel/${id}/reject`, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['travel'] }),
  });
}

export function useCancelTravelRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/travel/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['travel'] }),
  });
}
