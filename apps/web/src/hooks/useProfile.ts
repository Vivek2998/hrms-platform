import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@hrms/shared-types';

export interface MyProfile {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  bloodGroup: string | null;
  maritalStatus: string | null;
  designation: string | null;
  dateOfJoining: string | null;
  department: { id: string; name: string } | null;
  officeLocation: { id: string; name: string } | null;
  presentAddress: {
    line1?: string; line2?: string; city?: string;
    state?: string; pincode?: string; country?: string;
  } | null;
  permanentAddress: {
    line1?: string; line2?: string; city?: string;
    state?: string; pincode?: string; country?: string;
  } | null;
  emergencyContact: { name?: string; phone?: string; relationship?: string } | null;
  bankAccountNumber: string | null;
  bankIfsc: string | null;
  bankName: string | null;
  bankBranch: string | null;
}

export type ProfileUpdateInput = Partial<Omit<MyProfile, 'id' | 'firstName' | 'lastName'>>;

const profileKeys = {
  me: ['profile', 'me'] as const,
};

export function useMyProfile() {
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<MyProfile>>('/employees/me');
      return res.data.data;
    },
  });
}

export function useUpdateMyProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProfileUpdateInput) => {
      const res = await apiClient.patch<ApiResponse<MyProfile>>('/employees/me/profile', input);
      return res.data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: profileKeys.me });
      toast.success('Profile updated');
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });
}
