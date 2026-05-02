import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAttendance, useEditAttendance } from "@/hooks/useAttendance";
import type { AttendanceRecord, AttendanceStatus } from "@hrms/shared-types";

const STATUSES: AttendanceStatus[] = [
  "PRESENT", "ABSENT", "LATE", "HALF_DAY", "WFH", "ON_LEAVE", "HOLIDAY", "WEEKEND", "PENDING",
];

function statusVariant(status: AttendanceStatus) {
  switch (status) {
    case "PRESENT": return "success";
    case "ABSENT": return "destructive";
    case "LATE": return "warning";
    case "WFH": return "outline";
    default: return "secondary";
  }
}

function fmtTime(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function fmtHours(minutes: number) {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

const editSchema = z.object({
  punchIn: z.string().optional(),
  punchOut: z.string().optional(),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "HALF_DAY", "WFH", "ON_LEAVE", "HOLIDAY"]).optional(),
  editReason: z.string().min(5, "Reason must be at least 5 characters"),
});

type EditForm = z.infer<typeof editSchema>;

function EditDialog({
  record,
  open,
  onClose,
}: {
  record: AttendanceRecord;
  open: boolean;
  onClose: () => void;
}) {
  const editMutation = useEditAttendance();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      punchIn: record.punchIn
        ? new Date(record.punchIn).toISOString().slice(0, 16)
        : undefined,
      punchOut: record.punchOut
        ? new Date(record.punchOut).toISOString().slice(0, 16)
        : undefined,
      status: record.status as EditForm["status"],
    },
  });

  function onSubmit(data: EditForm) {
    editMutation.mutate(
      {
        id: record.id,
        input: {
          ...(data.punchIn ? { punchIn: new Date(data.punchIn).toISOString() } : {}),
          ...(data.punchOut ? { punchOut: new Date(data.punchOut).toISOString() } : {}),
          ...(data.status ? { status: data.status } : {}),
          editReason: data.editReason,
        },
      },
      { onSuccess: onClose },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Attendance Record</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { void handleSubmit(onSubmit)(e); }} className="space-y-4">
          <div className="space-y-1">
            <Label>Punch In</Label>
            <Input type="datetime-local" {...register("punchIn")} />
          </div>
          <div className="space-y-1">
            <Label>Punch Out</Label>
            <Input type="datetime-local" {...register("punchOut")} />
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <Select
              defaultValue={record.status}
              onValueChange={(v) => { setValue("status", v as EditForm["status"]); }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {(["PRESENT", "ABSENT", "LATE", "HALF_DAY", "WFH", "ON_LEAVE", "HOLIDAY"] as const).map(
                  (s) => <SelectItem key={s} value={s}>{s}</SelectItem>,
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Reason for edit *</Label>
            <Input placeholder="Explain why this record is being changed" {...register("editReason")} />
            {errors.editReason && (
              <p className="text-xs text-destructive">{errors.editReason.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={editMutation.isPending}>
              {editMutation.isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AttendancePage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | "ALL">("ALL");
  const [editing, setEditing] = useState<AttendanceRecord | null>(null);

  const from = new Date(year, month - 1, 1).toISOString();
  const to = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

  const { data, isLoading } = useAttendance({
    from,
    to,
    ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
    limit: 100,
  });

  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const years = [now.getFullYear() - 1, now.getFullYear()];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Attendance</h1>
          <p className="text-muted-foreground">
            {data?.meta.total ?? "—"} records for {MONTHS[month - 1]} {year}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select
          value={`${month}`}
          onValueChange={(v) => { setMonth(Number(v)); }}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m, i) => (
              <SelectItem key={i} value={`${i + 1}`}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={`${year}`}
          onValueChange={(v) => { setYear(Number(v)); }}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={`${y}`}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v) => { setStatusFilter(v as AttendanceStatus | "ALL"); }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Records</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : data?.data.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No attendance records found for this period.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-xs font-medium text-muted-foreground">
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Punch In</th>
                    <th className="px-4 py-3">Punch Out</th>
                    <th className="px-4 py-3">Hours</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data?.data.map((rec) => (
                    <tr key={rec.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">
                        {rec.employee
                          ? `${rec.employee.firstName} ${rec.employee.lastName}`
                          : rec.employeeId.slice(0, 8)}
                        {rec.isManuallyEdited && (
                          <span className="ml-1.5 text-xs text-muted-foreground">(edited)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {fmtDate(rec.date)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant(rec.status)}>
                          {rec.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{fmtTime(rec.punchIn)}</td>
                      <td className="px-4 py-3">{fmtTime(rec.punchOut)}</td>
                      <td className="px-4 py-3">
                        {fmtHours(rec.workingMinutes ?? 0)}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => { setEditing(rec); }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {editing && (
        <EditDialog
          record={editing}
          open={true}
          onClose={() => { setEditing(null); }}
        />
      )}
    </div>
  );
}
