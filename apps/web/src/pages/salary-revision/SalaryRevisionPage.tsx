import { useState } from 'react';
import { TrendingUp, Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  useSalaryRevisionProposals, useCreateRevisionProposal,
  useApproveRevisionProposal, useRejectRevisionProposal,
} from '@/hooks/useSalaryRevisions';
import { useAuthStore } from '@/stores/auth.store';
import { format } from 'date-fns';

const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-3 h-3" /> },
  APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3 h-3" /> },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: <XCircle className="w-3 h-3" /> },
};

export default function SalaryRevisionPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const { data: proposals, isLoading } = useSalaryRevisionProposals();
  const approve = useApproveRevisionProposal();
  const reject = useRejectRevisionProposal();
  const user = useAuthStore((s) => s.user);
  const isHR = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(user?.role ?? '');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-500" />
            Salary Revision
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Appraisal proposals and approvals</p>
        </div>
        {isHR && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" /> New Proposal
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
      ) : !proposals?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <TrendingUp className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No proposals yet</h3>
          <p className="text-muted-foreground text-sm">Create a salary revision proposal to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {proposals.map((p: any) => {
            const meta = (STATUS_META[p.status] ?? STATUS_META['PENDING'])!;
            return (
              <Card key={p.id} className="border shadow-sm">
                <CardContent className="pt-4 pb-3 px-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">
                          {p.employee?.firstName} {p.employee?.lastName}
                        </p>
                        <span className="text-xs text-muted-foreground">{p.employee?.employeeCode}</span>
                        <Badge variant="outline" className={`text-xs flex items-center gap-1 ${meta.color}`}>
                          {meta.icon} {meta.label}
                        </Badge>
                      </div>
                      <div className="mt-1.5 flex gap-4 text-sm text-muted-foreground">
                        <span>Current: <strong className="text-foreground">₹{p.currentSalary?.toLocaleString()}</strong></span>
                        <span>Proposed: <strong className="text-emerald-600">₹{p.proposedSalary?.toLocaleString()}</strong></span>
                        {p.effectiveDate && (
                          <span>Effective: <strong className="text-foreground">{format(new Date(p.effectiveDate), 'dd MMM yyyy')}</strong></span>
                        )}
                      </div>
                      {p.reason && <p className="text-xs text-muted-foreground mt-1 italic">{p.reason}</p>}
                    </div>
                    {isHR && p.status === 'PENDING' && (
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50"
                          onClick={() => approve.mutate(p.id)} disabled={approve.isPending}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => { setRejectTarget(p.id); setRejectReason(''); }}>
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreateProposalDialog open={showCreate} onClose={() => setShowCreate(false)} />

      <Dialog open={!!rejectTarget} onOpenChange={() => setRejectTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Reject Proposal</DialogTitle></DialogHeader>
          <div>
            <Label>Reason (optional)</Label>
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button variant="destructive" disabled={reject.isPending}
              onClick={() => { reject.mutate({ id: rejectTarget!, reason: rejectReason }); setRejectTarget(null); }}>
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateProposalDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [employeeId, setEmployeeId] = useState('');
  const [currentSalary, setCurrentSalary] = useState('');
  const [proposedSalary, setProposedSalary] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [reason, setReason] = useState('');
  const create = useCreateRevisionProposal();

  async function handleSubmit() {
    if (!employeeId || !currentSalary || !proposedSalary) return;
    await create.mutateAsync({
      employeeId, currentSalary: Number(currentSalary),
      proposedSalary: Number(proposedSalary), effectiveDate: effectiveDate || undefined, reason,
    });
    setEmployeeId(''); setCurrentSalary(''); setProposedSalary(''); setEffectiveDate(''); setReason('');
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>New Revision Proposal</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Employee ID</Label>
            <Input placeholder="UUID" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Current Salary (₹)</Label>
              <Input type="number" value={currentSalary} onChange={(e) => setCurrentSalary(e.target.value)} />
            </div>
            <div>
              <Label>Proposed Salary (₹)</Label>
              <Input type="number" value={proposedSalary} onChange={(e) => setProposedSalary(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Effective Date</Label>
            <Input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />
          </div>
          <div>
            <Label>Reason</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!employeeId || !currentSalary || !proposedSalary || create.isPending}>
            Submit Proposal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
