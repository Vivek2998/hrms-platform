import { useState } from 'react';
import { Plus, CheckCircle, XCircle } from 'lucide-react';
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
  useRegularisations,
  useCreateRegularisation,
  useReviewRegularisation,
  type RegularisationRequest,
} from '@/hooks/useRegularisation';
import { useAuthStore } from '@/stores/auth.store';

type Tab = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

const TABS: { label: string; value: Tab }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
];

function statusVariant(status: RegularisationRequest['status']) {
  switch (status) {
    case 'APPROVED': return 'success';
    case 'REJECTED': return 'destructive';
    default: return 'warning';
  }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface ReviewTarget {
  request: RegularisationRequest;
  action: 'APPROVED' | 'REJECTED';
}

function ReviewDialog({ target, onClose }: { target: ReviewTarget | null; onClose: () => void }) {
  const [remarks, setRemarks] = useState('');
  const reviewMutation = useReviewRegularisation();

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
          <DialogTitle>{isReject ? 'Reject Request' : 'Approve Request'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="bg-muted/40 rounded-lg p-3 text-sm">
            <p className="font-medium">
              {request.employee
                ? `${request.employee.firstName} ${request.employee.lastName}`
                : request.employeeId.slice(0, 8)}
              {request.employee && (
                <span className="text-muted-foreground ml-1 font-normal">
                  · {request.employee.employeeCode}
                </span>
              )}
            </p>
            <p className="text-muted-foreground mt-0.5">
              Regularisation for {fmtDate(request.date)}
              {request.requestedIn && ` · In: ${request.requestedIn}`}
              {request.requestedOut && ` · Out: ${request.requestedOut}`}
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

function ApplyDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createMutation = useCreateRegularisation();
  const [form, setForm] = useState({ date: '', requestedIn: '', requestedOut: '', reason: '' });

  function handleSubmit() {
    if (!form.date || !form.reason.trim()) return;
    createMutation.mutate(
      {
        date: form.date,
        ...(form.requestedIn ? { requestedIn: form.requestedIn } : {}),
        ...(form.requestedOut ? { requestedOut: form.requestedOut } : {}),
        reason: form.reason.trim(),
      },
      { onSuccess: () => { setForm({ date: '', requestedIn: '', requestedOut: '', reason: '' }); onClose(); } },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Attendance Regularisation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Date of Attendance</Label>
            <Input
              type="date"
              value={form.date}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => { setForm((f) => ({ ...f, date: e.target.value })); }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Punch-In Time (optional)</Label>
              <Input
                type="time"
                value={form.requestedIn}
                onChange={(e) => { setForm((f) => ({ ...f, requestedIn: e.target.value })); }}
              />
            </div>
            <div className="space-y-1">
              <Label>Punch-Out Time (optional)</Label>
              <Input
                type="time"
                value={form.requestedOut}
                onChange={(e) => { setForm((f) => ({ ...f, requestedOut: e.target.value })); }}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Reason</Label>
            <Textarea
              placeholder="Explain why you need this attendance corrected…"
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
            disabled={createMutation.isPending || !form.date || !form.reason.trim()}
          >
            {createMutation.isPending ? 'Submitting…' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function RegularisationPage() {
  const role = useAuthStore((s) => s.user?.role);
  const isHR = role && ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'].includes(role);

  const [tab, setTab] = useState<Tab>('PENDING');
  const [showApply, setShowApply] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);

  const { data, isLoading } = useRegularisations(tab !== 'ALL' ? tab : undefined);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Attendance Regularisation</h1>
          <p className="text-muted-foreground">
            {isHR ? 'Review and approve regularisation requests' : 'Request correction for missed or incorrect attendance'}
          </p>
        </div>
        <Button onClick={() => { setShowApply(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          New Request
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
          <CardTitle>Regularisation Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : data?.data.length === 0 ? (
            <p className="text-muted-foreground py-12 text-center text-sm">
              No {tab !== 'ALL' ? tab.toLowerCase() : ''} requests found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground border-b text-left text-xs font-medium">
                    {isHR && <th className="px-4 py-3">Employee</th>}
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Requested In</th>
                    <th className="px-4 py-3">Requested Out</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Applied On</th>
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
                      <td className="px-4 py-3 font-medium">{fmtDate(r.date)}</td>
                      <td className="text-muted-foreground px-4 py-3">{r.requestedIn ?? '—'}</td>
                      <td className="text-muted-foreground px-4 py-3">{r.requestedOut ?? '—'}</td>
                      <td className="text-muted-foreground max-w-[200px] truncate px-4 py-3 text-xs italic">
                        {r.reason}
                      </td>
                      <td className="text-muted-foreground px-4 py-3">{fmtDate(r.createdAt)}</td>
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
