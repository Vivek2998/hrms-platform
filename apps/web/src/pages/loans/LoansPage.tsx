import { useState } from 'react';
import { useSessionStorageState } from '@/hooks/useSessionStorageState';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard, Plus, CheckCircle, XCircle, Clock, Banknote, Lock } from 'lucide-react';
import {
  useLoans, useCreateLoan, useApproveLoan, useRejectLoan,
  useDisburseLoan, useCloseLoan, useCancelLoan,
  type LoanRequest, type LoanType,
} from '@/hooks/useLoans';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';

const APPROVER_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'];

const LOAN_TYPES: LoanType[] = ['PERSONAL_LOAN', 'SALARY_ADVANCE', 'VEHICLE_LOAN', 'HOME_LOAN', 'EDUCATION_LOAN', 'OTHER'];
const TYPE_LABELS: Record<LoanType, string> = {
  PERSONAL_LOAN: 'Personal Loan',
  SALARY_ADVANCE: 'Salary Advance',
  VEHICLE_LOAN: 'Vehicle Loan',
  HOME_LOAN: 'Home Loan',
  EDUCATION_LOAN: 'Education Loan',
  OTHER: 'Other',
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  REJECTED: 'bg-red-100 text-red-700',
  DISBURSED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-500',
  CANCELLED: 'bg-gray-100 text-gray-400',
};

const createSchema = z.object({
  loanType: z.enum(['PERSONAL_LOAN', 'SALARY_ADVANCE', 'VEHICLE_LOAN', 'HOME_LOAN', 'EDUCATION_LOAN', 'OTHER']),
  amount: z.coerce.number().positive('Must be positive'),
  tenure: z.coerce.number().int().positive().optional().or(z.literal('')),
  purpose: z.string().min(3, 'Min 3 characters'),
  notes: z.string().optional(),
});

type CreateForm = z.infer<typeof createSchema>;

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="bg-card rounded-lg border p-4 flex items-center gap-4">
      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function LoansPage() {
  const { user } = useAuthStore();
  const isApprover = APPROVER_ROLES.includes(user?.role ?? '');

  const { data: loans = [], isLoading } = useLoans();
  const createLoan = useCreateLoan();
  const approveLoan = useApproveLoan();
  const rejectLoan = useRejectLoan();
  const disburseLoan = useDisburseLoan();
  const closeLoan = useCloseLoan();
  const cancelLoan = useCancelLoan();

  const [showCreate, setShowCreate] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<LoanRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [filterStatus, setFilterStatus] = useSessionStorageState<string>('loans_status', 'ALL');

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
  });

  const filtered = loans.filter(l => filterStatus === 'ALL' || l.status === filterStatus);

  const stats = {
    total: loans.length,
    pending: loans.filter(l => l.status === 'PENDING').length,
    approved: loans.filter(l => l.status === 'APPROVED').length,
    disbursed: loans.filter(l => l.status === 'DISBURSED').length,
  };

  const fmtAmt = (n: number | null) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';
  const fmtDate = (d: string | null) => d ? format(new Date(d), 'dd MMM yyyy') : '—';

  async function onCreate(data: CreateForm) {
    try {
      await createLoan.mutateAsync({
        loanType: data.loanType,
        amount: Number(data.amount),
        tenure: data.tenure ? Number(data.tenure) : undefined,
        purpose: data.purpose,
        notes: data.notes,
      });
      toast.success('Loan request submitted');
      setShowCreate(false);
      reset();
    } catch {
      toast.error('Failed to submit request');
    }
  }

  async function onApprove(id: string) {
    try { await approveLoan.mutateAsync(id); toast.success('Approved'); }
    catch { toast.error('Failed to approve'); }
  }

  async function onReject() {
    if (!rejectTarget) return;
    try {
      await rejectLoan.mutateAsync({ id: rejectTarget.id, reason: rejectReason });
      toast.success('Rejected');
      setRejectTarget(null);
      setRejectReason('');
    } catch { toast.error('Failed to reject'); }
  }

  async function onDisburse(id: string) {
    try { await disburseLoan.mutateAsync(id); toast.success('Marked as disbursed'); }
    catch { toast.error('Failed to update'); }
  }

  async function onClose(id: string) {
    try { await closeLoan.mutateAsync(id); toast.success('Loan closed'); }
    catch { toast.error('Failed to close'); }
  }

  async function onCancel(id: string) {
    try { await cancelLoan.mutateAsync(id); toast.success('Cancelled'); }
    catch { toast.error('Failed to cancel'); }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
            <CreditCard className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Loans & Advances</h1>
            <p className="text-sm text-muted-foreground">Salary advances and loan requests</p>
          </div>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Request Loan
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={CreditCard} label="Total" value={stats.total} color="bg-violet-100 text-violet-600" />
        <StatCard icon={Clock} label="Pending" value={stats.pending} color="bg-yellow-100 text-yellow-600" />
        <StatCard icon={CheckCircle} label="Approved" value={stats.approved} color="bg-blue-100 text-blue-600" />
        <StatCard icon={Banknote} label="Disbursed" value={stats.disbursed} color="bg-green-100 text-green-600" />
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'DISBURSED', 'CLOSED', 'CANCELLED'].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filterStatus === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase().replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No loan requests found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  {isApprover && <th className="px-4 py-3 text-left font-medium text-muted-foreground">Employee</th>}
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tenure</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Purpose</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Applied</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(loan => {
                  const isOwn = loan.employeeId === (user as any)?.employeeId;
                  return (
                    <tr key={loan.id} className="hover:bg-muted/20">
                      {isApprover && (
                        <td className="px-4 py-3">
                          <span className="font-medium">{loan.employee.firstName} {loan.employee.lastName}</span>
                          <br /><span className="text-xs text-muted-foreground">{loan.employee.employeeCode}</span>
                        </td>
                      )}
                      <td className="px-4 py-3 font-medium">{TYPE_LABELS[loan.loanType]}</td>
                      <td className="px-4 py-3 font-semibold">{fmtAmt(loan.amount)}</td>
                      <td className="px-4 py-3">{loan.tenure ? `${loan.tenure} mo` : '—'}</td>
                      <td className="px-4 py-3 max-w-[160px] truncate text-muted-foreground">{loan.purpose}</td>
                      <td className="px-4 py-3 text-muted-foreground">{fmtDate(loan.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Badge className={STATUS_STYLES[loan.status]}>{loan.status}</Badge>
                        {loan.rejectedReason && <p className="mt-1 text-xs text-red-500">{loan.rejectedReason}</p>}
                        {loan.disbursedAt && <p className="mt-1 text-xs text-muted-foreground">Paid: {fmtDate(loan.disbursedAt)}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {isApprover && loan.status === 'PENDING' && (
                            <>
                              <Button size="sm" variant="outline" className="h-7 text-xs text-green-600 border-green-200 hover:bg-green-50"
                                onClick={() => onApprove(loan.id)}>Approve</Button>
                              <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => setRejectTarget(loan)}>Reject</Button>
                            </>
                          )}
                          {isApprover && loan.status === 'APPROVED' && (
                            <Button size="sm" variant="outline" className="h-7 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                              onClick={() => onDisburse(loan.id)}>
                              <Banknote className="h-3 w-3 mr-1" /> Disburse
                            </Button>
                          )}
                          {isApprover && loan.status === 'DISBURSED' && (
                            <Button size="sm" variant="outline" className="h-7 text-xs"
                              onClick={() => onClose(loan.id)}>
                              <Lock className="h-3 w-3 mr-1" /> Close
                            </Button>
                          )}
                          {(isOwn || isApprover) && loan.status === 'PENDING' && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground"
                              onClick={() => onCancel(loan.id)}>
                              <XCircle className="h-3 w-3 mr-1" /> Cancel
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Request Loan / Advance</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
            <div>
              <Label>Loan Type *</Label>
              <Select onValueChange={(v) => setValue('loanType', v as LoanType)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {LOAN_TYPES.map(t => <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.loanType && <p className="text-xs text-red-500 mt-1">{errors.loanType.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Amount (₹) *</Label>
                <Input type="number" {...register('amount')} placeholder="50000" />
                {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
              </div>
              <div>
                <Label>Tenure (months)</Label>
                <Input type="number" {...register('tenure')} placeholder="12" />
              </div>
            </div>
            <div>
              <Label>Purpose *</Label>
              <Textarea {...register('purpose')} placeholder="Medical emergency, home renovation…" rows={2} />
              {errors.purpose && <p className="text-xs text-red-500 mt-1">{errors.purpose.message}</p>}
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea {...register('notes')} placeholder="Any additional details…" rows={2} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => { setShowCreate(false); reset(); }}>Cancel</Button>
              <Button type="submit" disabled={createLoan.isPending}>
                {createLoan.isPending ? 'Submitting…' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={() => setRejectTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Reject Loan Request</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Rejecting {TYPE_LABELS[rejectTarget?.loanType ?? 'OTHER']} request of {fmtAmt(rejectTarget?.amount ?? null)} from {rejectTarget?.employee.firstName} {rejectTarget?.employee.lastName}
            </p>
            <div>
              <Label>Reason (optional)</Label>
              <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
              <Button variant="destructive" onClick={onReject} disabled={rejectLoan.isPending}>
                {rejectLoan.isPending ? 'Rejecting…' : 'Reject'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
