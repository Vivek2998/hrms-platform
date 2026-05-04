import { useState } from 'react';
import { Pencil, Trash2, CheckCircle2, XCircle } from 'lucide-react';
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
  useLeaveTypes,
  useCreateLeaveType,
  useUpdateLeaveType,
  useDeleteLeaveType,
  type LeaveType,
  type LeaveTypePayload,
} from '@/hooks/useLeaveTypes';

const COLOR_PRESETS = [
  '#6366f1', // Indigo
  '#3b82f6', // Blue
  '#22c55e', // Green
  '#eab308', // Yellow
  '#f97316', // Orange
  '#ef4444', // Red
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#6b7280', // Gray
];

const leaveTypeSchema = z.object({
  name: z.string().min(1, 'Required').max(100),
  code: z.string().min(1, 'Required').max(20),
  daysAllowed: z.coerce.number().int().min(0, 'Min 0'),
  isPaid: z.boolean().default(true),
  isCarryForward: z.boolean().default(false),
  maxCarryForward: z.coerce.number().int().min(0).default(0),
  isEncashable: z.boolean().default(false),
  applicableAfterDays: z.coerce.number().int().min(0).default(0),
  colorHex: z.string().default('#6366f1'),
});

type LeaveTypeForm = z.infer<typeof leaveTypeSchema>;

function toDefaults(lt?: LeaveType): LeaveTypeForm {
  return {
    name: lt?.name ?? '',
    code: lt?.code ?? '',
    daysAllowed: lt?.daysAllowed ?? 0,
    isPaid: lt?.isPaid ?? true,
    isCarryForward: lt?.isCarryForward ?? false,
    maxCarryForward: lt?.maxCarryForward ?? 0,
    isEncashable: lt?.isEncashable ?? false,
    applicableAfterDays: lt?.applicableAfterDays ?? 0,
    colorHex: lt?.colorHex ?? '#6366f1',
  };
}

function Toggle({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => { onChange(!value); }}
      className="flex items-center gap-2"
    >
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${value ? 'bg-primary' : 'bg-muted'}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${value ? 'left-4' : 'left-0.5'}`}
        />
      </span>
      <span className="text-sm">{label}</span>
    </button>
  );
}

function LeaveTypeDialog({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing?: LeaveType;
}) {
  const createMutation = useCreateLeaveType();
  const updateMutation = useUpdateLeaveType(editing?.id ?? '');
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<LeaveTypeForm>({
    resolver: zodResolver(leaveTypeSchema),
    values: toDefaults(editing),
  });

  const errors = form.formState.errors;
  const isCarryForward = form.watch('isCarryForward');

  const onSubmit = (data: LeaveTypeForm) => {
    const payload: LeaveTypePayload = { ...data, code: data.code.toUpperCase() };
    if (editing) {
      updateMutation.mutate(payload, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>{editing ? 'Edit Leave Type' : 'Add Leave Type'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="max-h-[65vh] overflow-y-auto px-6 py-5 space-y-5">
            {/* Name + Code */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">Name <span className="text-destructive">*</span></Label>
                <Input placeholder="e.g. Casual Leave" {...form.register('name')} />
                {errors.name && <p className="text-destructive mt-1 text-xs">{errors.name.message}</p>}
              </div>
              <div>
                <Label className="mb-1.5 block">Code <span className="text-destructive">*</span></Label>
                <Input placeholder="e.g. CL" {...form.register('code')} className="uppercase" />
                {errors.code && <p className="text-destructive mt-1 text-xs">{errors.code.message}</p>}
              </div>
            </div>

            {/* Days + Applicable After */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">Days Per Year <span className="text-destructive">*</span></Label>
                <Input type="number" min={0} {...form.register('daysAllowed')} />
                {errors.daysAllowed && <p className="text-destructive mt-1 text-xs">{errors.daysAllowed.message}</p>}
              </div>
              <div>
                <Label className="mb-1.5 block">Applicable After (days of joining)</Label>
                <Input type="number" min={0} {...form.register('applicableAfterDays')} />
              </div>
            </div>

            {/* Color picker */}
            <div>
              <Label className="mb-2 block">Color</Label>
              <Controller
                control={form.control}
                name="colorHex"
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PRESETS.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => { field.onChange(hex); }}
                        className="h-7 w-7 rounded-full ring-offset-2 transition-all"
                        style={{
                          backgroundColor: hex,
                          outline: field.value === hex ? `2px solid ${hex}` : '2px solid transparent',
                          outlineOffset: '2px',
                        }}
                        title={hex}
                      />
                    ))}
                  </div>
                )}
              />
            </div>

            {/* Toggles */}
            <div className="space-y-3 rounded-lg border p-4">
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Options</p>
              <Controller
                control={form.control}
                name="isPaid"
                render={({ field }) => (
                  <Toggle value={field.value} onChange={field.onChange} label="Paid Leave" />
                )}
              />
              <Controller
                control={form.control}
                name="isCarryForward"
                render={({ field }) => (
                  <Toggle value={field.value} onChange={field.onChange} label="Allow Carry Forward to Next Year" />
                )}
              />
              {isCarryForward && (
                <div className="ml-11">
                  <Label className="mb-1 block text-xs">Max Carry Forward Days</Label>
                  <Input
                    type="number"
                    min={0}
                    className="h-8 w-32 text-sm"
                    {...form.register('maxCarryForward')}
                  />
                </div>
              )}
              <Controller
                control={form.control}
                name="isEncashable"
                render={({ field }) => (
                  <Toggle value={field.value} onChange={field.onChange} label="Encashable on Exit" />
                )}
              />
            </div>
          </div>

          <DialogFooter className="border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : editing ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Pill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
        ok ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
      }`}
    >
      {ok ? <CheckCircle2 className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
      {label}
    </span>
  );
}

// Standard leave types recommended for Indian organisations
const SUGGESTED = [
  { name: 'Casual Leave', code: 'CL', days: 12, paid: true },
  { name: 'Sick Leave', code: 'SL', days: 12, paid: true },
  { name: 'Earned Leave', code: 'EL', days: 15, paid: true },
  { name: 'Half Day Leave', code: 'HDL', days: 12, paid: true },
  { name: 'Short Leave', code: 'SHL', days: 6, paid: true },
  { name: 'Compensatory Off', code: 'COMP', days: 0, paid: true },
  { name: 'Maternity Leave', code: 'MTL', days: 182, paid: true },
  { name: 'Paternity Leave', code: 'PTL', days: 15, paid: true },
  { name: 'Bereavement Leave', code: 'BVL', days: 5, paid: true },
  { name: 'Marriage Leave', code: 'MRL', days: 5, paid: true },
  { name: 'Study Leave', code: 'STL', days: 5, paid: false },
];

interface LeaveTypesPanelProps {
  showAdd: boolean;
  onCloseAdd: () => void;
}

export function LeaveTypesPanel({ showAdd, onCloseAdd }: LeaveTypesPanelProps) {
  const [editing, setEditing] = useState<LeaveType | undefined>();
  const [deleting, setDeleting] = useState<LeaveType | undefined>();

  const { data: leaveTypes = [], isLoading } = useLeaveTypes();
  const deleteMutation = useDeleteLeaveType();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>All Leave Types</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : leaveTypes.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground mb-4 text-sm">
                No leave types configured yet. Add your first leave type to get started.
              </p>
              <div className="text-muted-foreground mx-auto max-w-md text-left">
                <p className="mb-2 text-xs font-semibold uppercase">Recommended for Indian organisations:</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED.map((s) => (
                    <span key={s.code} className="bg-muted rounded px-2 py-0.5 text-xs">
                      {s.name} ({s.code}) · {s.days} days
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {leaveTypes.map((lt) => (
                <div key={lt.id} className="flex items-center gap-4 px-6 py-4">
                  {/* Color dot + code */}
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: lt.colorHex + '22' }}
                  >
                    <span className="text-[10px] font-bold" style={{ color: lt.colorHex }}>
                      {lt.code.slice(0, 4)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: lt.colorHex }}
                      />
                      <p className="font-medium truncate">{lt.name}</p>
                      <Badge variant="secondary" className="text-[10px]">{lt.code}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <span className="text-muted-foreground text-xs">
                        {lt.daysAllowed} days/year
                      </span>
                      {lt.applicableAfterDays > 0 && (
                        <span className="text-muted-foreground text-xs">
                          · after {lt.applicableAfterDays}d joining
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <Pill ok={lt.isPaid} label="Paid" />
                    <Pill ok={lt.isCarryForward} label={lt.isCarryForward ? `CF ${lt.maxCarryForward}d` : 'No CF'} />
                    <Pill ok={lt.isEncashable} label="Encash" />
                  </div>

                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => { setEditing(lt); }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive h-8 w-8"
                      onClick={() => { setDeleting(lt); }}
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

      <LeaveTypeDialog open={showAdd} onClose={onCloseAdd} />
      {editing && (
        <LeaveTypeDialog
          open={true}
          editing={editing}
          onClose={() => { setEditing(undefined); }}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => { if (!o) setDeleting(undefined); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the leave type. Existing leave balances and requests will not be
              affected, but employees will no longer be able to apply for this leave type.
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
