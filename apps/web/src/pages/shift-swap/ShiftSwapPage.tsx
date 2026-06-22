import { useState } from 'react';
import { useSessionStorageState } from '@/hooks/useSessionStorageState';
import { Plus, CheckCircle, XCircle, ArrowLeftRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  useShiftSwaps, useCreateShiftSwap, useAcceptShiftSwap,
  useApproveShiftSwap, useRejectShiftSwap, useCancelShiftSwap,
} from '@/hooks/useShiftSwap';
import { useEmployees } from '@/hooks/useEmployees';
import { useAuthStore } from '@/stores/auth.store';

const APPROVER_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'];

function statusVariant(status: string) {
  if (status === 'APPROVED') return 'success';
  if (status === 'REJECTED' || status === 'CANCELLED') return 'destructive';
  if (status === 'PENDING_APPROVAL') return 'warning';
  return 'secondary';
}

function statusLabel(status: string) {
  if (status === 'PENDING_ACCEPTANCE') return 'Awaiting Target';
  if (status === 'PENDING_APPROVAL') return 'Awaiting Approval';
  return status;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

type TabVal = 'ALL' | 'PENDING_ACCEPTANCE' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
const TABS: { label: string; value: TabVal }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Awaiting Target', value: 'PENDING_ACCEPTANCE' },
  { label: 'Awaiting Approval', value: 'PENDING_APPROVAL' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
];

export default function ShiftSwapPage() {
  const { user } = useAuthStore();
  const isApprover = APPROVER_ROLES.includes(user?.role ?? '');
  const [tab, setTab] = useSessionStorageState<TabVal>('shift_swap_tab', 'ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: swaps = [], isLoading } = useShiftSwaps();
  const acceptMutation = useAcceptShiftSwap();
  const approveMutation = useApproveShiftSwap();
  const rejectMutation = useRejectShiftSwap();
  const cancelMutation = useCancelShiftSwap();

  const filtered = tab === 'ALL' ? swaps : swaps.filter((s: any) => s.status === tab);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Shift Swap</h1>
          <p className="text-muted-foreground text-sm">Request shift swaps with colleagues</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> Request Swap
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-lg border p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <ArrowLeftRight className="text-muted-foreground h-10 w-10" />
            <p className="text-muted-foreground text-sm">No shift swap requests found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((swap: any) => (
            <Card key={swap.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <ArrowLeftRight className="text-primary h-5 w-5 mt-1 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                          {swap.requester?.firstName} {swap.requester?.lastName}
                        </span>
                        <span className="text-muted-foreground text-xs">gives {fmtDate(swap.requesterDate)}</span>
                        <span className="text-muted-foreground">↔</span>
                        <span className="font-medium text-sm">
                          {swap.target?.firstName} {swap.target?.lastName}
                        </span>
                        <span className="text-muted-foreground text-xs">gives {fmtDate(swap.targetDate)}</span>
                      </div>
                      {swap.reason && <p className="text-muted-foreground text-xs mt-1">{swap.reason}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    <Badge variant={statusVariant(swap.status) as any}>{statusLabel(swap.status)}</Badge>
                    {swap.status === 'PENDING_ACCEPTANCE' && swap.target?.id === user?.id && (
                      <>
                        <Button size="sm" variant="outline" className="text-green-600 border-green-300"
                          disabled={acceptMutation.isPending}
                          onClick={() => acceptMutation.mutate(swap.id)}>
                          <CheckCircle className="h-3.5 w-3.5 mr-1" /> Accept
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-300"
                          onClick={() => { setRejectTarget(swap); setRejectReason(''); }}>
                          <XCircle className="h-3.5 w-3.5 mr-1" /> Decline
                        </Button>
                      </>
                    )}
                    {swap.status === 'PENDING_APPROVAL' && isApprover && (
                      <>
                        <Button size="sm" variant="outline" className="text-green-600 border-green-300"
                          disabled={approveMutation.isPending}
                          onClick={() => approveMutation.mutate(swap.id)}>
                          <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-300"
                          onClick={() => { setRejectTarget(swap); setRejectReason(''); }}>
                          <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                    {swap.status === 'PENDING_ACCEPTANCE' && swap.requester?.id === user?.id && (
                      <Button size="sm" variant="outline"
                        disabled={cancelMutation.isPending}
                        onClick={() => cancelMutation.mutate(swap.id)}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateSwapDialog open={showCreate} onClose={() => setShowCreate(false)} />

      <Dialog open={!!rejectTarget} onOpenChange={() => setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Shift Swap</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Reason (optional)</Label>
            <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button variant="destructive"
              disabled={rejectMutation.isPending}
              onClick={() => rejectMutation.mutate({ id: rejectTarget.id, reason: rejectReason }, {
                onSuccess: () => setRejectTarget(null),
              })}>
              {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateSwapDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [targetId, setTargetId] = useState('');
  const [myDate, setMyDate] = useState('');
  const [theirDate, setTheirDate] = useState('');
  const [reason, setReason] = useState('');
  const { data: empData } = useEmployees({ limit: 200 });
  const employees = empData?.employees ?? [];
  const createMutation = useCreateShiftSwap();
  const { user } = useAuthStore();

  const handleSubmit = () => {
    if (!targetId || !myDate || !theirDate) return;
    createMutation.mutate({
      targetId, requesterDate: myDate, targetDate: theirDate, reason: reason || undefined,
    }, { onSuccess: () => { onClose(); setTargetId(''); setMyDate(''); setTheirDate(''); setReason(''); } });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Request Shift Swap</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Swap With <span className="text-destructive">*</span></Label>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select colleague" /></SelectTrigger>
              <SelectContent>
                {employees.filter((e: any) => e.id !== user?.id).map((e: any) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.firstName} {e.lastName} ({e.employeeCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>My Date <span className="text-destructive">*</span></Label>
              <Input type="date" value={myDate} onChange={e => setMyDate(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Their Date <span className="text-destructive">*</span></Label>
              <Input type="date" value={theirDate} onChange={e => setTheirDate(e.target.value)} className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label>Reason (optional)</Label>
            <Textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} className="mt-1.5" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!targetId || !myDate || !theirDate || createMutation.isPending}>
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
