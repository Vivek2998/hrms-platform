import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/axios";
import type { ApiResponse, AttendanceRecord, AttendanceStatus } from "@hrms/shared-types";

interface AttendanceParams {
  page?: number;
  limit?: number;
  employeeId?: string;
  from?: string;
  to?: string;
  status?: AttendanceStatus;
}

interface ManualEditInput {
  punchIn?: string;
  punchOut?: string;
  status?: AttendanceStatus;
  editReason: string;
}

export const attendanceKeys = {
  all: ["attendance"] as const,
  list: (params: AttendanceParams) => ["attendance", "list", params] as const,
};

export function useAttendance(params: AttendanceParams = {}) {
  return useQuery({
    queryKey: attendanceKeys.list(params),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<AttendanceRecord[]>>(
        "/attendance",
        { params },
      );
      return { data: res.data.data, meta: res.data.meta! };
    },
  });
}

export function useEditAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: ManualEditInput;
    }) => {
      const res = await apiClient.patch<ApiResponse<AttendanceRecord>>(
        `/attendance/${id}`,
        input,
      );
      return res.data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: attendanceKeys.all });
      toast.success("Attendance record updated");
    },
  });
}
