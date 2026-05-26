import { useState } from 'react';
import { useSessionStorageState } from '@/hooks/useSessionStorageState';
import { Plus, CheckCircle, XCircle, Home, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  useWFHRequests, useCreateWFH, useApproveWFH, useRejectWFH, useCancelWFH,
} from '@/hooks/useWFH';
import { useAuthStore } from '@/stores/auth.store';

const APPROVER_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'];

function statusVariant(status: string) {
  if (status === 'APPROVED') return 'success';
  if (status === 'REJECTED') return 'destructive';
  if (status === 'CANCELLED') return 'secondary';
  return 'warning';
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

type TabVal = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';
const TABS: { label: string; value: TabVal }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
];

export default function WFHPage() {
  const { user } = useAuthStore();
  const isApprover = APPROVER_ROLES.includes(user?.role ?? '');
  const [tab, setTab] = useSessionStorageState<TabVal>('wfh_tab', 'ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: requests = [], isLoading } = useWFHRequests();
  const createMutation = useCreateWFH();
  const approveMutation = useApproveWFH();
  const rejectMutation = useRejectWFH();
  const cancelMutation = useCancelWFH();

  const filtered = tab === 'ALL' ? requests : requests.filter((r: any) => r.status === tab);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Work From Home</h1>
          <p className="text-muted-foreground text-sm">Request WFH days — auto-marks attendance on approval</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" /> Request WFH
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Home className="text-muted-foreground h-10 w-10" />
            <p className="text-muted-foreground text-sm">No WFH requests found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((req: any) => (
            <Card key={req.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                    <Home className="text-primary h-5 w-5" />
                  </div>
                  <div>
                    {isApprover && (
                      <p className="font-medium">
                        {req.employee?.firstName} {req.employee?.lastName}
                        <span className="text-muted-foreground ml-1 text-xs">({req.employee?.employeeCode})</span>
                      </p>
                    )}
                    <p className={isApprover ? 'text-sm text-muted-foreground' : 'font-medium'}>
                      {fmtDate(req.date)}
                    </p>
                    {req.reason && <p className="text-muted-foreground text-xs mt-0.5">{req.reason}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant(req.status) as any}>{req.status}</Badge>
                  {req.status === 'PENDING' && isApprover && (
                    <>
                      <Button
                        size="sm" variant="outline"
                        className="text-green-600 border-green-300"
                        disabled={approveMutation.isPending}
                        onClick={() => approveMutation.mutate(req.id)}
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm" variant="outline"
                        className="text-red-600 border-red-300"
                        onClick={() => { setRejectTarget(req); setRejectReason(''); }}
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                      </Button>
                    </>
                  )}
                  {req.status === 'PENDING' && !isApprover && (
                    <Button
                      size="sm" variant="outline"
                      disabled={cancelMutation.isPending}
                      onClick={() => cancelMutation.mutate(req.id)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <CreateWFHDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        mutation={createMutation}
      />

      {/* Reject Dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={() => setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject WFH Request</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Rejecting WFH for <strong>{rejectTarget?.employee?.firstName} {rejectTarget?.employee?.lastName}</strong> on {rejectTarget ? fmtDate(rejectTarget.date) : ''}
            </p>
            <Label>Reason (optional)</Label>
            <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={rejectMutation.isPending}
              onClick={() => rejectMutation.mutate({ id: rejectTarget.id, reason: rejectReason }, {
                onSuccess: () => setRejectTarget(null),
              })}
            >
              {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateWFHDialog({ open, onClose, mutation }: { open: boolean; onClose: () => void; mutation: any }) {
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (!date) return;
    mutation.mutate({ date, reason: reason || undefined }, {
      onSuccess: () => { onClose(); setDate(''); setReason(''); },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Request Work From Home</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Date <span className="text-destructive">*</span></Label>
            <Input
              type="date"
              value={date}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setDate(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Reason (optional)</Label>
            <Textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} className="mt-1.5" placeholder="Why are you working from home?" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!date || mutation.isPending}>
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
