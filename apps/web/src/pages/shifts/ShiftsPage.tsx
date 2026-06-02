import { useState } from 'react';
import { useSessionStorageState } from '@/hooks/useSessionStorageState';
import { Plus, Pencil, Trash2, Moon, UserPlus } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useShifts,
  useCreateShift,
  useUpdateShift,
  useDeleteShift,
  useShiftAssignments,
  useAssignShift,
  useUpdateShiftAssignment,
  useRemoveShiftAssignment,
  type Shift,
  type ShiftPayload,
  type ShiftAssignment,
} from '@/hooks/useShifts';
import { useEmployees } from '@/hooks/useEmployees';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const shiftSchema = z.object({
  name: z.string().min(1, 'Required').max(100),
  code: z.string().min(1, 'Required').max(20),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'HH:mm required'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'HH:mm required'),
  graceMinutes: z.coerce.number().int().min(0).default(0),
  halfDayAfterMinutes: z.coerce.number().int().min(0).default(240),
  absentAfterMinutes: z.coerce.number().int().min(0).default(480),
  breakDurationMinutes: z.coerce.number().int().min(0).default(60),
  isNightShift: z.boolean().default(false),
  weeklyOffDays: z.array(z.number()).default([0, 6]),
});

type ShiftForm = z.infer<typeof shiftSchema>;

function toDefaults(shift?: Shift): ShiftForm {
  return {
    name: shift?.name ?? '',
    code: shift?.code ?? '',
    startTime: shift?.startTime ?? '09:00',
    endTime: shift?.endTime ?? '18:00',
    graceMinutes: shift?.graceMinutes ?? 0,
    halfDayAfterMinutes: shift?.halfDayAfterMinutes ?? 240,
    absentAfterMinutes: shift?.absentAfterMinutes ?? 480,
    breakDurationMinutes: shift?.breakDurationMinutes ?? 60,
    isNightShift: shift?.isNightShift ?? false,
    weeklyOffDays: shift?.weeklyOffDays ?? [0, 6],
  };
}

function ShiftDialog({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing?: Shift;
}) {
  const createMutation = useCreateShift();
  const updateMutation = useUpdateShift(editing?.id ?? '');
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<ShiftForm>({
    resolver: zodResolver(shiftSchema),
    values: toDefaults(editing),
  });

  const errors = form.formState.errors;

  const onSubmit = (data: ShiftForm) => {
    const payload: ShiftPayload = { ...data, code: data.code.toUpperCase() };
    if (editing) {
      updateMutation.mutate(payload, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  const toggleDay = (day: number, current: number[]) => {
    return current.includes(day) ? current.filter((d) => d !== day) : [...current, day];
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Shift' : 'Add Shift'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block">Shift Name <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. Morning Shift" {...form.register('name')} />
              {errors.name && <p className="text-destructive mt-1 text-xs">{errors.name.message}</p>}
            </div>
            <div>
              <Label className="mb-1.5 block">Code <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. MORN" {...form.register('code')} className="uppercase" />
              {errors.code && <p className="text-destructive mt-1 text-xs">{errors.code.message}</p>}
            </div>
            <div>
              <Label className="mb-1.5 block">Start Time <span className="text-destructive">*</span></Label>
              <Input type="time" {...form.register('startTime')} />
            </div>
            <div>
              <Label className="mb-1.5 block">End Time <span className="text-destructive">*</span></Label>
              <Input type="time" {...form.register('endTime')} />
            </div>
            <div>
              <Label className="mb-1.5 block">Grace Period (min)</Label>
              <Input type="number" min={0} {...form.register('graceMinutes')} />
            </div>
            <div>
              <Label className="mb-1.5 block">Break Duration (min)</Label>
              <Input type="number" min={0} {...form.register('breakDurationMinutes')} />
            </div>
            <div>
              <Label className="mb-1.5 block">Half Day After (min)</Label>
              <Input type="number" min={0} {...form.register('halfDayAfterMinutes')} />
            </div>
            <div>
              <Label className="mb-1.5 block">Absent After (min)</Label>
              <Input type="number" min={0} {...form.register('absentAfterMinutes')} />
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Weekly Off Days</Label>
            <Controller
              control={form.control}
              name="weeklyOffDays"
              render={({ field }) => (
                <div className="flex gap-2">
                  {DAY_LABELS.map((label, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => { field.onChange(toggleDay(idx, field.value)); }}
                      className={`h-9 w-9 rounded-full text-xs font-medium transition-colors ${
                        field.value.includes(idx)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          <div className="flex items-center gap-2">
            <Controller
              control={form.control}
              name="isNightShift"
              render={({ field }) => (
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={field.value}
                  onClick={() => { field.onChange(!field.value); }}
                  className={`relative h-5 w-9 rounded-full transition-colors ${field.value ? 'bg-primary' : 'bg-muted'}`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${field.value ? 'left-4' : 'left-0.5'}`}
                  />
                </button>
              )}
            />
            <Label className="cursor-pointer">Night Shift</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : editing ? 'Save Changes' : 'Create Shift'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function fmt12(time: string) {
  const parts = time.split(':').map(Number);
  const h = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

// ─── Assign Shift Dialog ──────────────────────────────────────────────────────

function AssignShiftDialog({ open, onClose, shifts }: { open: boolean; onClose: () => void; shifts: Shift[] }) {
  const assignMutation = useAssignShift();
  const { data } = useEmployees({ limit: 200 });
  const employees = data?.employees ?? [];

  const [form, setForm] = useState({ employeeId: '', shiftId: '', effectiveFrom: '' });

  function handleSubmit() {
    if (!form.employeeId || !form.shiftId || !form.effectiveFrom) return;
    assignMutation.mutate(
      {
        employeeId: form.employeeId,
        shiftId: form.shiftId,
        effectiveFrom: new Date(form.effectiveFrom + 'T00:00:00.000Z').toISOString(),
      },
      { onSuccess: () => { setForm({ employeeId: '', shiftId: '', effectiveFrom: '' }); onClose(); } },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Shift to Employee</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Employee</Label>
            <Select value={form.employeeId} onValueChange={(v) => { setForm((f) => ({ ...f, employeeId: v })); }}>
              <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.firstName} {e.lastName} · {e.employeeCode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Shift</Label>
            <Select value={form.shiftId} onValueChange={(v) => { setForm((f) => ({ ...f, shiftId: v })); }}>
              <SelectTrigger><SelectValue placeholder="Select shift" /></SelectTrigger>
              <SelectContent>
                {shifts.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({s.startTime} – {s.endTime})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Effective From</Label>
            <Input
              type="date"
              value={form.effectiveFrom}
              onChange={(e) => { setForm((f) => ({ ...f, effectiveFrom: e.target.value })); }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={assignMutation.isPending || !form.employeeId || !form.shiftId || !form.effectiveFrom}
          >
            {assignMutation.isPending ? 'Assigning…' : 'Assign Shift'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Assignment Dialog ───────────────────────────────────────────────────

function toDateInput(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

function EditAssignmentDialog({
  open,
  assignment,
  shifts,
  onClose,
}: {
  open: boolean;
  assignment: ShiftAssignment;
  shifts: Shift[];
  onClose: () => void;
}) {
  const updateMutation = useUpdateShiftAssignment();

  const [form, setForm] = useState({
    shiftId: assignment.shiftId,
    effectiveFrom: toDateInput(assignment.effectiveFrom),
    effectiveTo: assignment.effectiveTo ? toDateInput(assignment.effectiveTo) : '',
  });

  function handleSubmit() {
    updateMutation.mutate(
      {
        id: assignment.id,
        shiftId: form.shiftId,
        effectiveFrom: new Date(form.effectiveFrom + 'T00:00:00.000Z').toISOString(),
        effectiveTo: form.effectiveTo
          ? new Date(form.effectiveTo + 'T00:00:00.000Z').toISOString()
          : null,
      },
      { onSuccess: onClose },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Shift Assignment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Employee info — read-only */}
          <div className="bg-muted/50 rounded-lg px-4 py-2.5">
            <p className="text-sm font-medium">
              {assignment.employee.firstName} {assignment.employee.lastName}
            </p>
            <p className="text-muted-foreground text-xs">{assignment.employee.employeeCode}</p>
          </div>

          <div className="space-y-1">
            <Label>Shift</Label>
            <Select
              value={form.shiftId}
              onValueChange={(v) => { setForm((f) => ({ ...f, shiftId: v })); }}
            >
              <SelectTrigger><SelectValue placeholder="Select shift" /></SelectTrigger>
              <SelectContent>
                {shifts.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({s.startTime} – {s.endTime})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Effective From</Label>
            <Input
              type="date"
              value={form.effectiveFrom}
              onChange={(e) => { setForm((f) => ({ ...f, effectiveFrom: e.target.value })); }}
            />
          </div>

          <div className="space-y-1">
            <Label>
              Effective To{' '}
              <span className="text-muted-foreground text-xs font-normal">(leave blank = ongoing)</span>
            </Label>
            <Input
              type="date"
              value={form.effectiveTo}
              onChange={(e) => { setForm((f) => ({ ...f, effectiveTo: e.target.value })); }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={updateMutation.isPending || !form.shiftId || !form.effectiveFrom}
          >
            {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Assignments Panel ────────────────────────────────────────────────────────

function AssignmentsPanel({ shifts }: { shifts: Shift[] }) {
  const [showAssign, setShowAssign] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<ShiftAssignment | undefined>();
  const { data: assignments = [], isLoading } = useShiftAssignments();
  const removeMutation = useRemoveShiftAssignment();

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { setShowAssign(true); }}>
          <UserPlus className="h-4 w-4" />
          Assign Shift
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Assignments</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : assignments.length === 0 ? (
            <p className="text-muted-foreground py-12 text-center text-sm">
              No shift assignments yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground border-b text-left text-xs font-medium">
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Shift</th>
                    <th className="px-4 py-3">Effective From</th>
                    <th className="px-4 py-3">Effective To</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {assignments.map((a) => (
                    <tr key={a.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="font-medium">{a.employee.firstName} {a.employee.lastName}</p>
                        <p className="text-muted-foreground text-xs">{a.employee.employeeCode}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{a.shift.name}</p>
                        <p className="text-muted-foreground text-xs">{a.shift.startTime} – {a.shift.endTime}</p>
                      </td>
                      <td className="text-muted-foreground px-4 py-3">{fmtDate(a.effectiveFrom)}</td>
                      <td className="text-muted-foreground px-4 py-3">
                        {a.effectiveTo ? fmtDate(a.effectiveTo) : 'Ongoing'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => { setEditingAssignment(a); }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive h-7 w-7"
                            disabled={removeMutation.isPending}
                            onClick={() => { removeMutation.mutate(a.id); }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AssignShiftDialog open={showAssign} onClose={() => { setShowAssign(false); }} shifts={shifts} />

      {editingAssignment && (
        <EditAssignmentDialog
          open={true}
          assignment={editingAssignment}
          shifts={shifts}
          onClose={() => { setEditingAssignment(undefined); }}
        />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type ShiftTab = 'shifts' | 'assignments';

export default function ShiftsPage() {
  const [tab, setTab] = useSessionStorageState<ShiftTab>('shifts_tab', 'shifts');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Shift | undefined>();
  const [deleting, setDeleting] = useState<Shift | undefined>();

  const { data: shifts = [], isLoading } = useShifts();
  const deleteMutation = useDeleteShift();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Shifts</h1>
          <p className="text-muted-foreground">Configure work shifts and employee assignments</p>
        </div>
        <div className="flex items-center gap-3">
          {tab === 'shifts' && (
            <Button onClick={() => { setShowAdd(true); }}>
              <Plus className="h-4 w-4" />
              Add Shift
            </Button>
          )}
          <div className="bg-muted/30 flex gap-1 rounded-lg border p-1">
            <button
              onClick={() => { setTab('shifts'); }}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === 'shifts' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Shifts
            </button>
            <button
              onClick={() => { setTab('assignments'); }}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === 'assignments' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Assignments
            </button>
          </div>
        </div>
      </div>

      {tab === 'assignments' ? (
        <AssignmentsPanel shifts={shifts} />
      ) : (
      <Card>
        <CardHeader>
          <CardTitle>All Shifts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : shifts.length === 0 ? (
            <p className="text-muted-foreground py-12 text-center text-sm">
              No shifts configured. Add your first shift to get started.
            </p>
          ) : (
            <div className="divide-y">
              {shifts.map((shift) => (
                <div key={shift.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                    <span className="text-primary text-xs font-bold">{shift.code.slice(0, 3)}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{shift.name}</p>
                      {shift.isNightShift && (
                        <Moon className="text-indigo-500 h-3.5 w-3.5" />
                      )}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {fmt12(shift.startTime)} – {fmt12(shift.endTime)}
                      {' · '}Grace: {shift.graceMinutes}min
                      {' · '}Break: {shift.breakDurationMinutes}min
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {DAY_LABELS.map((label, idx) => (
                        <span
                          key={idx}
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium ${
                            shift.weeklyOffDays.includes(idx)
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {label[0]}
                        </span>
                      ))}
                    </div>
                    <Badge variant="secondary" className="ml-2 w-16 justify-center truncate">{shift.code}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => { setEditing(shift); }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive h-8 w-8"
                      onClick={() => { setDeleting(shift); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      )}

      <ShiftDialog open={showAdd} onClose={() => { setShowAdd(false); }} />
      {editing && (
        <ShiftDialog open={true} editing={editing} onClose={() => { setEditing(undefined); }} />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => { if (!o) setDeleting(undefined); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the shift. Employees assigned to this shift will need to be
              reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white"
              onClick={() => {
                if (!deleting) return;
                deleteMutation.mutate(deleting.id, { onSuccess: () => { setDeleting(undefined); } });
              }}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
