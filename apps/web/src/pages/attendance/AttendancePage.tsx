import { useState } from 'react';
import { useSessionStorageState } from '@/hooks/useSessionStorageState';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Pencil,
  ChevronLeft,
  ChevronRight,
  LayoutList,
  CalendarDays,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAttendance, useEditAttendance } from '@/hooks/useAttendance';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';
import { downloadCsv } from '@/lib/downloadCsv';
import { toast } from 'sonner';
import type { AttendanceRecord, AttendanceStatus, PunchMethod } from '@hrms/shared-types';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const STATUS_COLORS: Record<string, string> = {
  PRESENT:   'bg-green-100  text-green-800  border-green-200',
  ABSENT:    'bg-red-100    text-red-800    border-red-200',
  LATE:      'bg-orange-100 text-orange-800 border-orange-200',
  HALF_DAY:  'bg-yellow-100 text-yellow-800 border-yellow-200',
  WFH:       'bg-sky-100    text-sky-800    border-sky-200',
  ON_LEAVE:  'bg-purple-100 text-purple-800 border-purple-200',
  HOLIDAY:   'bg-pink-100   text-pink-800   border-pink-200',
  WEEKEND:   'bg-gray-100   text-gray-500   border-gray-200',
  PENDING:   'bg-gray-50    text-gray-400   border-gray-200',
};

const STATUSES: AttendanceStatus[] = [
  'PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'WFH', 'ON_LEAVE', 'HOLIDAY', 'WEEKEND', 'PENDING',
];

function statusVariant(status: AttendanceStatus) {
  switch (status) {
    case 'PRESENT':  return 'success';
    case 'ABSENT':   return 'destructive';
    case 'LATE':     return 'warning';
    case 'WFH':      return 'outline';
    default:         return 'secondary';
  }
}

function fmtTime(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtHours(minutes: number) {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h)}h ${String(m)}m`;
}

const PUNCH_METHOD_META: Record<PunchMethod, { label: string; className: string }> = {
  FINGERPRINT: { label: '👆 Fingerprint', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  FACE_ID:     { label: '🫥 Face ID',    className: 'bg-sky-100    text-sky-800    border-sky-200'    },
  MANUAL:      { label: 'Manual',        className: 'bg-gray-100   text-gray-600   border-gray-200'   },
};

function PunchMethodBadge({ method }: { method?: PunchMethod | null }) {
  if (!method) return <span className="text-muted-foreground text-xs">—</span>;
  const { label, className } = PUNCH_METHOD_META[method];
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

// ─── Edit Dialog ────────────────────────────────────────────────────────────

const editSchema = z.object({
  punchIn:    z.string().optional(),
  punchOut:   z.string().optional(),
  status:     z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'WFH', 'ON_LEAVE', 'HOLIDAY']).optional(),
  editReason: z.string().min(5, 'Reason must be at least 5 characters'),
});

type EditForm = z.infer<typeof editSchema>;

function EditDialog({ record, open, onClose }: { record: AttendanceRecord; open: boolean; onClose: () => void }) {
  const editMutation = useEditAttendance();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      punchIn:  record.punchIn  ? new Date(record.punchIn).toISOString().slice(0, 16)  : undefined,
      punchOut: record.punchOut ? new Date(record.punchOut).toISOString().slice(0, 16) : undefined,
      status:   record.status as EditForm['status'],
    },
  });

  function onSubmit(data: EditForm) {
    editMutation.mutate(
      {
        id: record.id,
        input: {
          ...(data.punchIn  ? { punchIn:  new Date(data.punchIn).toISOString()  } : {}),
          ...(data.punchOut ? { punchOut: new Date(data.punchOut).toISOString() } : {}),
          ...(data.status   ? { status: data.status }                             : {}),
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
            <Input type="datetime-local" {...register('punchIn')} />
          </div>
          <div className="space-y-1">
            <Label>Punch Out</Label>
            <Input type="datetime-local" {...register('punchOut')} />
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <Select
              defaultValue={record.status}
              onValueChange={(v) => { setValue('status', v as EditForm['status']); }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'WFH', 'ON_LEAVE', 'HOLIDAY'] as const).map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Reason for edit *</Label>
            <Input placeholder="Explain why this record is being changed" {...register('editReason')} />
            {errors.editReason && <p className="text-destructive text-xs">{errors.editReason.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={editMutation.isPending}>
              {editMutation.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Calendar View ───────────────────────────────────────────────────────────

function CalendarView({
  year,
  month,
  records,
  onEdit,
  isEmployee,
}: {
  year: number;
  month: number;
  records: AttendanceRecord[];
  onEdit: (rec: AttendanceRecord) => void;
  isEmployee: boolean;
}) {
  const byDate = new Map<string, AttendanceRecord>();
  for (const r of records) {
    const key = r.date.slice(0, 10);
    byDate.set(key, r);
  }

  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  // 0=Sun…6=Sat → shift so Monday=0
  const startOffset = (firstDay.getDay() + 6) % 7;

  const cells: (number | null)[] = [
    ...Array<null>(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const today = new Date();
  const isToday = (d: number) =>
    today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === d;

  return (
    <div className="space-y-2">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="text-muted-foreground py-2 text-center text-xs font-medium">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />;
          const dateStr = `${String(year)}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const rec = byDate.get(dateStr);
          const colorClass = rec ? (STATUS_COLORS[rec.status] ?? STATUS_COLORS.PENDING) : '';

          return (
            <div
              key={idx}
              className={cn(
                'group relative min-h-[72px] rounded-lg border p-1.5 text-center transition-shadow',
                rec ? colorClass : 'bg-background border-border',
                rec && !isEmployee ? 'cursor-pointer hover:shadow-sm' : '',
                isToday(day) && !rec && 'border-primary ring-1 ring-primary/30',
              )}
              onClick={() => { if (rec && !isEmployee) onEdit(rec); }}
            >
              <span
                className={cn(
                  'text-xs font-semibold',
                  isToday(day) && 'text-primary',
                  rec ? '' : 'text-muted-foreground',
                )}
              >
                {day}
              </span>
              {rec && (
                <p className="mt-1 text-[10px] font-medium leading-tight">
                  {rec.status.replace('_', ' ')}
                </p>
              )}
              {rec?.punchIn && (
                <p className="text-[9px] leading-tight opacity-70">{fmtTime(rec.punchIn)}</p>
              )}
              {rec && !isEmployee && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0.5 top-0.5 hidden h-5 w-5 group-hover:flex"
                  onClick={(e) => { e.stopPropagation(); onEdit(rec); }}
                >
                  <Pencil className="h-2.5 w-2.5" />
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 pt-2">
        {Object.entries(STATUS_COLORS).map(([status, cls]) => (
          <span key={status} className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium', cls)}>
            {status.replace('_', ' ')}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type ViewMode = 'list' | 'calendar';

export default function AttendancePage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());
  const [statusFilter, setStatusFilter] = useSessionStorageState<AttendanceStatus | 'ALL'>('attendance_status', 'ALL');
  const [viewMode, setViewMode]         = useSessionStorageState<ViewMode>('attendance_view', 'list');
  const [editing, setEditing]           = useState<AttendanceRecord | null>(null);

  const role = useAuthStore((s) => s.user?.role);
  const isEmployee = role === 'EMPLOYEE';
  const canExport = role != null && ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'].includes(role);
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      await downloadCsv(
        '/reports/attendance',
        { month, year },
        `attendance_${year}_${String(month).padStart(2, '0')}.csv`,
      );
    } catch {
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  }

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
    if (isCurrentMonth) return;
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  const from = new Date(year, month - 1, 1).toISOString();
  const to   = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

  const { data, isLoading, isError, refetch } = useAttendance({
    from,
    to,
    ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
    limit: 100,
  });

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Attendance</h1>
          <p className="text-muted-foreground text-sm">
            {data?.meta.total ?? '—'} records for {MONTH_NAMES[month - 1]} {year}
          </p>
        </div>

        {/* Month / Year navigation */}
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={prevMonth} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[130px] text-center text-sm font-semibold">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={nextMonth}
            disabled={isCurrentMonth}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status filter — only shown in list mode */}
        {viewMode === 'list' && (
          <Select
            value={statusFilter}
            onValueChange={(v) => { setStatusFilter(v as AttendanceStatus | 'ALL'); }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Export */}
        {canExport && (
          <Button variant="outline" size="sm" disabled={isExporting} onClick={() => { void handleExport(); }}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            {isExporting ? 'Exporting…' : 'Export CSV'}
          </Button>
        )}

        {/* View toggle */}
        <div className="ml-auto flex rounded-md border">
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-r-none border-r"
            onClick={() => { setViewMode('list'); }}
            aria-label="List view"
          >
            <LayoutList className="h-4 w-4" />
            <span className="ml-1.5 hidden sm:inline">List</span>
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-l-none"
            onClick={() => { setViewMode('calendar'); }}
            aria-label="Calendar view"
          >
            <CalendarDays className="h-4 w-4" />
            <span className="ml-1.5 hidden sm:inline">Calendar</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: viewMode === 'calendar' ? 3 : 5 }).map((_, i) => (
            <Skeleton key={i} className={viewMode === 'calendar' ? 'h-24 w-full' : 'h-10 w-full'} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : viewMode === 'calendar' ? (
        <Card>
          <CardContent className="pt-6">
            <CalendarView
              year={year}
              month={month}
              records={data?.data ?? []}
              onEdit={setEditing}
              isEmployee={isEmployee}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Records</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data?.data.length === 0 ? (
              <p className="text-muted-foreground py-12 text-center text-sm">
                No attendance records found for this period.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 text-muted-foreground border-b text-left text-xs font-medium">
                      {!isEmployee && <th className="px-4 py-3">Employee</th>}
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Punch In</th>
                      <th className="px-4 py-3">Punch Out</th>
                      <th className="px-4 py-3">Hours</th>
                      <th className="px-4 py-3">Method</th>
                      {!isEmployee && <th className="px-4 py-3" />}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data?.data.map((rec) => (
                      <tr key={rec.id} className="hover:bg-muted/30">
                        {!isEmployee && (
                          <td className="px-4 py-3 font-medium">
                            {rec.employee
                              ? `${rec.employee.firstName} ${rec.employee.lastName}`
                              : rec.employeeId.slice(0, 8)}
                            {rec.isManuallyEdited && (
                              <span className="text-muted-foreground ml-1.5 text-xs">(edited)</span>
                            )}
                          </td>
                        )}
                        <td className="text-muted-foreground px-4 py-3">{fmtDate(rec.date)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={statusVariant(rec.status)}>{rec.status}</Badge>
                        </td>
                        <td className="px-4 py-3">{fmtTime(rec.punchIn)}</td>
                        <td className="px-4 py-3">{fmtTime(rec.punchOut)}</td>
                        <td className="px-4 py-3">{fmtHours(rec.workingMinutes ?? 0)}</td>
                        <td className="px-4 py-3">
                          <PunchMethodBadge method={rec.punchMethod} />
                        </td>
                        {!isEmployee && (
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
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {editing && (
        <EditDialog record={editing} open={true} onClose={() => { setEditing(null); }} />
      )}
    </div>
  );
}
