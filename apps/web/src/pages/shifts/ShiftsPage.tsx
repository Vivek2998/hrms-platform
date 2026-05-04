import { useState } from 'react';
import { Plus, Pencil, Trash2, Moon } from 'lucide-react';
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
  useShifts,
  useCreateShift,
  useUpdateShift,
  useDeleteShift,
  type Shift,
  type ShiftPayload,
} from '@/hooks/useShifts';

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
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

export default function ShiftsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Shift | undefined>();
  const [deleting, setDeleting] = useState<Shift | undefined>();

  const { data: shifts = [], isLoading } = useShifts();
  const deleteMutation = useDeleteShift();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Shifts</h1>
          <p className="text-muted-foreground">Configure work shifts and timings</p>
        </div>
        <Button onClick={() => { setShowAdd(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Shift
        </Button>
      </div>

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
                    <Badge variant="secondary" className="ml-2">{shift.code}</Badge>
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
