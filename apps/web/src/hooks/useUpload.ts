import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@hrms/shared-types';

interface UploadResult {
  url: string;
  publicId: string;
}

export function useUploadFile(folder: 'avatars' | 'documents' | 'logos' = 'documents') {
  return useMutation({
    mutationFn: async (file: File): Promise<UploadResult> => {
      const form = new FormData();
      form.append('file', file);
      const res = await apiClient.post<ApiResponse<UploadResult>>(
        `/upload?folder=${folder}`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return res.data.data;
    },
  });
}
