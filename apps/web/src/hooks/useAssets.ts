import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';

export type AssetStatus = 'AVAILABLE' | 'ASSIGNED' | 'UNDER_REPAIR' | 'RETIRED' | 'LOST';
export type AssetCategory = 'LAPTOP' | 'DESKTOP' | 'PHONE' | 'TABLET' | 'MONITOR' | 'KEYBOARD' | 'MOUSE' | 'HEADSET' | 'CHAIR' | 'DESK' | 'ID_CARD' | 'ACCESS_CARD' | 'OTHER';

export interface AssetEmployee {
  id: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
  avatarUrl: string | null;
}

export interface AssetAssignment {
  id: string;
  assetId: string;
  employeeId: string;
  assignedAt: string;
  returnedAt: string | null;
  condition: string | null;
  notes: string | null;
  employee: AssetEmployee;
}

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  serialNumber: string | null;
  brand: string | null;
  model: string | null;
  purchaseDate: string | null;
  purchasePrice: number | null;
  warrantyExpiry: string | null;
  status: AssetStatus;
  notes: string | null;
  imageUrl: string | null;
  createdAt: string;
  assignments: AssetAssignment[];
}

export interface CreateAssetInput {
  name: string;
  category?: AssetCategory;
  serialNumber?: string;
  brand?: string;
  model?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyExpiry?: string;
  notes?: string;
}

export function useAssets() {
  return useQuery<Asset[]>({
    queryKey: ['assets'],
    queryFn: async () => {
      const res = await apiClient.get('/assets');
      return res.data.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAssetInput) => apiClient.post('/assets', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assets'] }),
  });
}

export function useUpdateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<CreateAssetInput> & { id: string }) =>
      apiClient.patch(`/assets/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assets'] }),
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/assets/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assets'] }),
  });
}

export function useAssignAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, employeeId, notes, condition }: { id: string; employeeId: string; notes?: string; condition?: string }) =>
      apiClient.post(`/assets/${id}/assign`, { employeeId, notes, condition }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assets'] }),
  });
}

export function useReturnAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, condition, notes }: { id: string; condition?: string; notes?: string }) =>
      apiClient.post(`/assets/${id}/return`, { condition, notes }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assets'] }),
  });
}
