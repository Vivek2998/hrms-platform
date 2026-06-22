import { useState } from 'react';
import { useSessionStorageState } from '@/hooks/useSessionStorageState';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
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
import {
  useMyLeaves,
  useMyLeaveBalance,
  useLeaveTypes,
  useApplyLeave,
  useCancelMyLeave,
  type MyLeaveRequest,
} from '@/hooks/useMyLeaves';
import { EmptyState } from '@/components/ui/empty-state';

type Tab = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

const TABS: { label: string; value: Tab }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

function statusVariant(status: MyLeaveRequest['status']) {
  switch (status) {
    case 'APPROVED': return 'success';
    case 'REJECTED': return 'destructive';
    case 'PENDING': return 'warning';
    default: return 'secondary';
  }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function ApplyLeaveDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: leaveTypes } = useLeaveTypes();
  const applyLeave = useApplyLeave();

  const [form, setForm] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: '',
    isHalfDay: false,
    session: '' as 'FIRST_HALF' | 'SECOND_HALF' | '',
  });

  function handleSubmit() {
    if (!form.leaveTypeId || !form.startDate || !form.endDate || !form.reason.trim()) return;
    applyLeave.mutate(
      {
        leaveTypeId: form.leaveTypeId,
        startDate: form.startDate,
        endDate: form.isHalfDay ? form.startDate : form.endDate,
        reason: form.reason.trim(),
        ...(form.isHalfDay && form.session ? { session: form.session } : {}),
      },
      { onSuccess: () => { setForm({ leaveTypeId: '', startDate: '', endDate: '', reason: '', isHalfDay: false, session: '' }); onClose(); } },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply for Leave</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Leave Type</Label>
            <Select
              value={form.leaveTypeId}
              onValueChange={(v) => { setForm((f) => ({ ...f, leaveTypeId: v })); }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes?.map((lt) => (
                  <SelectItem key={lt.id} value={lt.id}>{lt.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="halfDay"
              checked={form.isHalfDay}
              onChange={(e) => { setForm((f) => ({ ...f, isHalfDay: e.target.checked, session: '' })); }}
              className="h-4 w-4"
            />
            <label htmlFor="halfDay" className="text-sm font-medium">Half day</label>
          </div>

          {form.isHalfDay ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => { setForm((f) => ({ ...f, startDate: e.target.value })); }}
                />
              </div>
              <div className="space-y-1">
                <Label>Session</Label>
                <Select
                  value={form.session}
                  onValueChange={(v) => { setForm((f) => ({ ...f, session: v as 'FIRST_HALF' | 'SECOND_HALF' })); }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIRST_HALF">First Half</SelectItem>
                    <SelectItem value="SECOND_HALF">Second Half</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => { setForm((f) => ({ ...f, startDate: e.target.value })); }}
                />
              </div>
              <div className="space-y-1">
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  min={form.startDate}
                  onChange={(e) => { setForm((f) => ({ ...f, endDate: e.target.value })); }}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <Label>Reason</Label>
            <Textarea
              placeholder="Briefly describe your reason for leave…"
              rows={3}
              value={form.reason}
              onChange={(e) => { setForm((f) => ({ ...f, reason: e.target.value })); }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={
              applyLeave.isPending ||
              !form.leaveTypeId ||
              !form.startDate ||
              (!form.isHalfDay && !form.endDate) ||
              !form.reason.trim()
            }
          >
            {applyLeave.isPending ? 'Submitting…' : 'Submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function MyLeavesPage() {
  const [tab, setTab] = useSessionStorageState<Tab>('my_leaves_tab', 'ALL');
  const [showApply, setShowApply] = useState(false);

  const { data, isLoading } = useMyLeaves(tab !== 'ALL' ? tab : undefined);
  const { data: balances, isLoading: balanceLoading } = useMyLeaveBalance();
  const cancelLeave = useCancelMyLeave();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My Leaves</h1>
          <p className="text-muted-foreground">View your leave balance and apply for leave</p>
        </div>
        <Button onClick={() => { setShowApply(true); }}>
          <Plus className="h-4 w-4" />
          Apply Leave
        </Button>
      </div>

      {/* Leave balance cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {balanceLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
          : balances?.map((b) => (
              <Card key={b.leaveTypeId}>
                <CardContent className="p-4">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    {b.leaveType.name}
                  </p>
                  <div className="mt-2 flex items-end justify-between">
                    <span className="text-3xl font-bold">{b.remainingDays}</span>
                    <span className="text-muted-foreground text-xs">of {b.totalDays}</span>
                  </div>
                  <div className="bg-muted mt-2 h-1.5 overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (b.remainingDays / b.totalDays) * 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Status filter tabs */}
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

      {/* Leave history table */}
      <Card>
        <CardHeader>
          <CardTitle>Leave History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : data?.data.length === 0 ? (
            <EmptyState
              illustration="my-leaves"
              title="No leave requests"
              description={tab !== 'ALL' ? `No ${tab.toLowerCase()} requests found.` : 'You have not applied for any leaves yet.'}
              action={tab === 'ALL' ? { label: 'Apply Leave', onClick: () => { setShowApply(true); } } : undefined}
              className="py-4"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground border-b text-left text-xs font-medium">
                    <th className="px-4 py-3">Leave Type</th>
                    <th className="px-4 py-3">From</th>
                    <th className="px-4 py-3">To</th>
                    <th className="px-4 py-3">Days</th>
                    <th className="px-4 py-3">Applied On</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Remarks</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data?.data.map((leave) => (
                    <tr key={leave.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{leave.leaveType.name}</td>
                      <td className="text-muted-foreground px-4 py-3">{fmtDate(leave.fromDate)}</td>
                      <td className="text-muted-foreground px-4 py-3">{fmtDate(leave.toDate)}</td>
                      <td className="px-4 py-3">
                        {leave.totalDays}
                        {leave.session && (
                          <span className="text-muted-foreground ml-1 text-xs">
                            ({leave.session === 'FIRST_HALF' ? '1st' : '2nd'} half)
                          </span>
                        )}
                      </td>
                      <td className="text-muted-foreground px-4 py-3">{fmtDate(leave.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant(leave.status)}>{leave.status}</Badge>
                      </td>
                      <td className="text-muted-foreground max-w-[180px] truncate px-4 py-3 text-xs italic">
                        {leave.approvals?.[0]?.remarks ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        {leave.status === 'PENDING' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-muted-foreground hover:text-destructive h-7 gap-1"
                            disabled={cancelLeave.isPending}
                            onClick={() => { cancelLeave.mutate(leave.id); }}
                          >
                            <X className="h-3.5 w-3.5" />
                            Cancel
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ApplyLeaveDialog open={showApply} onClose={() => { setShowApply(false); }} />
    </div>
  );
}
