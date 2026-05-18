import { useState } from 'react';
import { Plus, CheckCircle, XCircle, CalendarIcon, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  useCompOffs,
  useCreateCompOff,
  useReviewCompOff,
  type CompOffRequest,
} from '@/hooks/useCompOff';
import { useAuthStore } from '@/stores/auth.store';

type Tab = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

const TABS: { label: string; value: Tab }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
];

function statusVariant(status: CompOffRequest['status']) {
  switch (status) {
    case 'APPROVED': return 'success';
    case 'REJECTED': return 'destructive';
    case 'EXPIRED': return 'secondary';
    default: return 'warning';
  }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface ReviewTarget {
  request: CompOffRequest;
  action: 'APPROVED' | 'REJECTED';
}

function ReviewDialog({ target, onClose }: { target: ReviewTarget | null; onClose: () => void }) {
  const [remarks, setRemarks] = useState('');
  const reviewMutation = useReviewCompOff();

  if (!target) return null;
  const { request, action } = target;
  const isReject = action === 'REJECTED';

  function handleConfirm() {
    reviewMutation.mutate(
      { id: request.id, action, ...(remarks.trim() ? { remarks: remarks.trim() } : {}) },
      { onSuccess: () => { setRemarks(''); onClose(); } },
    );
  }

  return (
    <Dialog open={!!target} onOpenChange={(o) => { if (!o) { setRemarks(''); onClose(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isReject ? 'Reject Comp Off' : 'Approve Comp Off'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="bg-muted/40 rounded-lg p-3 text-sm">
            <p className="font-medium">
              {request.employee
                ? `${request.employee.firstName} ${request.employee.lastName}`
                : request.employeeId.slice(0, 8)}
              {request.employee && (
                <span className="text-muted-foreground ml-1 font-normal">· {request.employee.employeeCode}</span>
              )}
            </p>
            <p className="text-muted-foreground mt-0.5">
              Worked on {fmtDate(request.workedDate)}
              {request.requestedDate && ` · Requesting off on ${fmtDate(request.requestedDate)}`}
            </p>
            <p className="mt-1 text-xs italic">&ldquo;{request.reason}&rdquo;</p>
          </div>
          <div className="space-y-1">
            <Label>Remarks{isReject ? ' *' : ' (optional)'}</Label>
            <Textarea
              value={remarks}
              onChange={(e) => { setRemarks(e.target.value); }}
              placeholder={isReject ? 'Reason for rejection…' : 'Add a note (optional)…'}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setRemarks(''); onClose(); }}>Cancel</Button>
          <Button
            variant={isReject ? 'destructive' : 'default'}
            disabled={reviewMutation.isPending || (isReject && !remarks.trim())}
            onClick={handleConfirm}
          >
            {reviewMutation.isPending ? 'Saving…' : isReject ? 'Reject' : 'Approve'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function _DatePickerField({
  label,
  value,
  disabled,
  minDate,
  maxDate,
  onChange,
  info,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  onChange: (value: string) => void;
  info?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(value + 'T00:00:00') : undefined;

  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Popover open={open && !disabled} onOpenChange={(o) => { if (!disabled) setOpen(o); }}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              'flex items-center gap-2 w-full rounded-md border px-3 py-2 text-sm text-left transition-colors',
              disabled
                ? 'opacity-50 cursor-default bg-muted/30'
                : 'cursor-pointer hover:bg-muted/20 bg-background',
              open && !disabled && 'ring-1 ring-ring',
            )}
          >
            <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className={cn('flex-1', selected ? 'text-foreground' : 'text-muted-foreground')}>
              {selected ? fmtDate(value) : 'Select date'}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) => {
              if (date) { onChange(format(date, 'yyyy-MM-dd')); setOpen(false); }
            }}
            disabled={(date) => {
              const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
              if (minDate) {
                const min = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
                if (d < min) return true;
              }
              if (maxDate) {
                const max = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());
                if (d > max) return true;
              }
              return false;
            }}
            defaultMonth={selected ?? minDate}
            autoFocus
          />
        </PopoverContent>
      </Popover>
      {info && (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Info className="h-3 w-3 shrink-0" />
          {info}
        </p>
      )}
    </div>
  );
}

function ApplyDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createMutation = useCreateCompOff();
  const [form, setForm] = useState({ workedDate: '', requestedDate: '', reason: '' });
  const today = new Date().toISOString().split('T')[0];

  const minCompOffDate = new Date(today + 'T00:00:00');
  const minWorkedDate = form.requestedDate
    ? new Date(new Date(form.requestedDate + 'T00:00:00').getTime() - 90 * 24 * 60 * 60 * 1000)
    : undefined;
  const maxWorkedDate = form.requestedDate
    ? new Date(form.requestedDate + 'T00:00:00')
    : undefined;

  function handleCompOffDateChange(value: string) {
    setForm((f) => {
      const minStr = value
        ? new Date(new Date(value + 'T00:00:00').getTime() - 90 * 24 * 60 * 60 * 1000)
            .toISOString().split('T')[0]
        : '';
      const newWorked =
        f.workedDate && value && minStr
          ? f.workedDate >= minStr && f.workedDate <= value ? f.workedDate : ''
          : '';
      return { ...f, requestedDate: value, workedDate: newWorked };
    });
  }

  function handleSubmit() {
    if (!form.requestedDate || !form.workedDate || !form.reason.trim()) return;
    createMutation.mutate(
      { workedDate: form.workedDate, requestedDate: form.requestedDate, reason: form.reason.trim() },
      { onSuccess: () => { setForm({ workedDate: '', requestedDate: '', reason: '' }); onClose(); } },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Comp Off</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Claim a compensatory off for a day you worked during a weekend or holiday.
          </p>

          <_DatePickerField
            label="Comp-Off Date"
            value={form.requestedDate}
            minDate={minCompOffDate}
            onChange={handleCompOffDateChange}
          />

          <_DatePickerField
            label="Date Worked"
            value={form.workedDate}
            disabled={!form.requestedDate}
            minDate={minWorkedDate}
            maxDate={maxWorkedDate}
            onChange={(v) => setForm((f) => ({ ...f, workedDate: v }))}
            info={!form.requestedDate ? 'Select comp-off date first' : undefined}
          />

          <div className="space-y-1">
            <Label>Reason / Work Done</Label>
            <Textarea
              placeholder="Briefly describe the work you did on that day…"
              rows={3}
              value={form.reason}
              onChange={(e) => { setForm((f) => ({ ...f, reason: e.target.value })); }}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            Comp off requests expire after 90 days if unused.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending || !form.requestedDate || !form.workedDate || !form.reason.trim()}
          >
            {createMutation.isPending ? 'Submitting…' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CompOffPage() {
  const role = useAuthStore((s) => s.user?.role);
  const isHR = role && ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'].includes(role);

  const [tab, setTab] = useState<Tab>('PENDING');
  const [showApply, setShowApply] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);

  const { data, isLoading } = useCompOffs(tab !== 'ALL' ? tab : undefined);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Comp Off</h1>
          <p className="text-muted-foreground">
            {isHR
              ? 'Review compensatory off requests from employees'
              : 'Request a compensatory off for working on a holiday or weekend'}
          </p>
        </div>
        <Button onClick={() => { setShowApply(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Request Comp Off
        </Button>
      </div>

      <div className="bg-muted/30 flex w-fit gap-1 rounded-lg border p-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => { setTab(t.value); }}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comp Off Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : data?.data.length === 0 ? (
            <p className="text-muted-foreground py-12 text-center text-sm">
              No {tab !== 'ALL' ? tab.toLowerCase() : ''} comp off requests found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground border-b text-left text-xs font-medium">
                    {isHR && <th className="px-4 py-3">Employee</th>}
                    <th className="px-4 py-3">Worked Date</th>
                    <th className="px-4 py-3">Requested Off</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Expires</th>
                    <th className="px-4 py-3">Status</th>
                    {isHR && <th className="px-4 py-3">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data?.data.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/30">
                      {isHR && (
                        <td className="px-4 py-3">
                          <p className="font-medium">
                            {r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : r.employeeId.slice(0, 8)}
                          </p>
                          {r.employee && <p className="text-muted-foreground text-xs">{r.employee.employeeCode}</p>}
                        </td>
                      )}
                      <td className="px-4 py-3 font-medium">{fmtDate(r.workedDate)}</td>
                      <td className="text-muted-foreground px-4 py-3">
                        {r.requestedDate ? fmtDate(r.requestedDate) : '—'}
                      </td>
                      <td className="text-muted-foreground max-w-[180px] truncate px-4 py-3 text-xs italic">
                        {r.reason}
                      </td>
                      <td className="text-muted-foreground px-4 py-3">
                        {r.expiresAt ? fmtDate(r.expiresAt) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                        {r.remarks && (
                          <p className="text-muted-foreground mt-0.5 text-xs italic">{r.remarks}</p>
                        )}
                      </td>
                      {isHR && (
                        <td className="px-4 py-3">
                          {r.status === 'PENDING' && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 gap-1 border-green-600 text-green-700 hover:bg-green-50"
                                onClick={() => { setReviewTarget({ request: r, action: 'APPROVED' }); }}
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 gap-1 border-red-600 text-red-700 hover:bg-red-50"
                                onClick={() => { setReviewTarget({ request: r, action: 'REJECTED' }); }}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Reject
                              </Button>
                            </div>
                          )}
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

      <ApplyDialog open={showApply} onClose={() => { setShowApply(false); }} />
      <ReviewDialog target={reviewTarget} onClose={() => { setReviewTarget(null); }} />
    </div>
  );
}
