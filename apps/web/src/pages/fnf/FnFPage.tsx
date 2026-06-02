import { useState } from 'react';
import { Plus, Calculator, CheckCircle, IndianRupee, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  useFnFSettlements, useCreateFnF, useSubmitFnF, useApproveFnF, useMarkFnFPaid,
} from '@/hooks/useFnF';
import { useEmployees } from '@/hooks/useEmployees';
import { useAuthStore } from '@/stores/auth.store';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'];

function statusVariant(status: string) {
  if (status === 'PAID') return 'success';
  if (status === 'APPROVED') return 'success';
  if (status === 'PENDING_APPROVAL') return 'warning';
  return 'secondary';
}

function fmtCurrency(val: number) {
  return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function FnFPage() {
  const { user } = useAuthStore();
  const isHr = HR_ROLES.includes(user?.role ?? '');
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const { data: settlements = [], isLoading } = useFnFSettlements();
  const submitMutation = useSubmitFnF();
  const approveMutation = useApproveFnF();
  const paidMutation = useMarkFnFPaid();

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Full & Final Settlement</h1>
          <p className="text-muted-foreground text-sm">Calculate and process exit settlements for departing employees</p>
        </div>
        {isHr && (
          <Button onClick={() => setShowCreate(true)} className="shrink-0">
            <Plus className="h-4 w-4" /> New Settlement
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : settlements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Calculator className="text-muted-foreground h-10 w-10" />
            <p className="text-muted-foreground text-sm">No FnF settlements found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {settlements.map((s: any) => (
            <Card key={s.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelected(s)}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-primary/10 rounded-full p-2 shrink-0">
                      <IndianRupee className="text-primary h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {s.employee?.firstName} {s.employee?.lastName}
                        <span className="text-muted-foreground text-xs ml-1">({s.employee?.employeeCode})</span>
                      </p>
                      <p className="text-muted-foreground text-xs truncate">
                        {s.employee?.designation} · Last working: {fmtDate(s.lastWorkingDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <div className="text-right mr-1">
                      <p className="font-bold text-lg">{fmtCurrency(s.netPayable)}</p>
                      <p className="text-muted-foreground text-xs">Net Payable</p>
                    </div>
                    <Badge variant={statusVariant(s.status) as any}>{s.status.replace('_', ' ')}</Badge>
                    {isHr && s.status === 'DRAFT' && (
                      <Button size="sm" variant="outline"
                        disabled={submitMutation.isPending}
                        onClick={e => { e.stopPropagation(); submitMutation.mutate(s.id); }}>
                        Submit
                      </Button>
                    )}
                    {isHr && s.status === 'PENDING_APPROVAL' && (
                      <Button size="sm" variant="outline" className="text-green-600 border-green-300"
                        disabled={approveMutation.isPending}
                        onClick={e => { e.stopPropagation(); approveMutation.mutate(s.id); }}>
                        <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                      </Button>
                    )}
                    {isHr && s.status === 'APPROVED' && (
                      <Button size="sm"
                        disabled={paidMutation.isPending}
                        onClick={e => { e.stopPropagation(); paidMutation.mutate(s.id); }}>
                        Mark Paid
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isHr && <CreateFnFDialog open={showCreate} onClose={() => setShowCreate(false)} />}
      <FnFDetailDialog settlement={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function CreateFnFDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: empData } = useEmployees({ limit: 500 });
  const employees = empData?.employees ?? [];
  const createMutation = useCreateFnF();

  const [form, setForm] = useState({
    employeeId: '', lastWorkingDate: '',
    basicDays: '', basicAmount: '',
    pendingLeavesDays: '', leaveEncashment: '',
    gratuityYears: '', gratuityAmount: '',
    bonusAmount: '', otherDeductions: '', notes: '',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const netPayable =
    (parseFloat(form.basicAmount) || 0) +
    (parseFloat(form.leaveEncashment) || 0) +
    (parseFloat(form.gratuityAmount) || 0) +
    (parseFloat(form.bonusAmount) || 0) -
    (parseFloat(form.otherDeductions) || 0);

  const handleSubmit = () => {
    createMutation.mutate({
      employeeId: form.employeeId,
      lastWorkingDate: form.lastWorkingDate,
      basicDays: parseFloat(form.basicDays) || 0,
      basicAmount: parseFloat(form.basicAmount) || 0,
      pendingLeavesDays: parseFloat(form.pendingLeavesDays) || 0,
      leaveEncashment: parseFloat(form.leaveEncashment) || 0,
      gratuityYears: parseFloat(form.gratuityYears) || 0,
      gratuityAmount: parseFloat(form.gratuityAmount) || 0,
      bonusAmount: parseFloat(form.bonusAmount) || 0,
      otherDeductions: parseFloat(form.otherDeductions) || 0,
      notes: form.notes || undefined,
    }, { onSuccess: onClose });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>New FnF Settlement</DialogTitle></DialogHeader>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Employee <span className="text-destructive">*</span></Label>
              <Select value={form.employeeId} onValueChange={v => set('employeeId', v)}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e: any) => (
                    <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeCode})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Last Working Date <span className="text-destructive">*</span></Label>
              <Input type="date" className="mt-1.5" value={form.lastWorkingDate} onChange={e => set('lastWorkingDate', e.target.value)} />
            </div>
          </div>

          <Separator />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Earnings</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Working Days (partial month)</Label>
              <Input type="number" className="mt-1.5" placeholder="e.g. 15" value={form.basicDays} onChange={e => set('basicDays', e.target.value)} />
            </div>
            <div>
              <Label>Basic Salary Amount (₹)</Label>
              <Input type="number" className="mt-1.5" value={form.basicAmount} onChange={e => set('basicAmount', e.target.value)} />
            </div>
            <div>
              <Label>Pending Leave Days</Label>
              <Input type="number" className="mt-1.5" value={form.pendingLeavesDays} onChange={e => set('pendingLeavesDays', e.target.value)} />
            </div>
            <div>
              <Label>Leave Encashment (₹)</Label>
              <Input type="number" className="mt-1.5" value={form.leaveEncashment} onChange={e => set('leaveEncashment', e.target.value)} />
            </div>
            <div>
              <Label>Gratuity Years</Label>
              <Input type="number" step="0.1" className="mt-1.5" value={form.gratuityYears} onChange={e => set('gratuityYears', e.target.value)} />
            </div>
            <div>
              <Label>Gratuity Amount (₹)</Label>
              <Input type="number" className="mt-1.5" value={form.gratuityAmount} onChange={e => set('gratuityAmount', e.target.value)} />
            </div>
            <div>
              <Label>Bonus (₹)</Label>
              <Input type="number" className="mt-1.5" value={form.bonusAmount} onChange={e => set('bonusAmount', e.target.value)} />
            </div>
          </div>

          <Separator />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Deductions</p>
          <div>
            <Label>Other Deductions (₹)</Label>
            <Input type="number" className="mt-1.5" value={form.otherDeductions} onChange={e => set('otherDeductions', e.target.value)} />
          </div>

          <Separator />
          <div className="flex justify-between items-center">
            <p className="font-semibold">Net Payable</p>
            <p className="text-xl font-bold text-primary">{`₹${netPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}</p>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea className="mt-1.5" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!form.employeeId || !form.lastWorkingDate || createMutation.isPending} onClick={handleSubmit}>
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Settlement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FnFDetailDialog({ settlement, onClose }: { settlement: any; onClose: () => void }) {
  if (!settlement) return null;
  const rows = [
    { label: 'Basic Salary', value: settlement.basicAmount, note: `${settlement.basicDays} days` },
    { label: 'Leave Encashment', value: settlement.leaveEncashment, note: `${settlement.pendingLeavesDays} days` },
    { label: 'Gratuity', value: settlement.gratuityAmount, note: `${settlement.gratuityYears} yrs` },
    { label: 'Bonus', value: settlement.bonusAmount },
    { label: 'Other Deductions', value: -settlement.otherDeductions, isDeduction: true },
  ];

  return (
    <Dialog open={!!settlement} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>FnF Settlement Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b">
            <FileText className="text-primary h-5 w-5" />
            <div>
              <p className="font-medium">{settlement.employee?.firstName} {settlement.employee?.lastName}</p>
              <p className="text-muted-foreground text-xs">{settlement.employee?.designation} · Last day: {fmtDate(settlement.lastWorkingDate)}</p>
            </div>
            <Badge variant={statusVariant(settlement.status) as any} className="ml-auto">
              {settlement.status.replace('_', ' ')}
            </Badge>
          </div>
          <div className="space-y-2">
            {rows.map(r => r.value !== 0 && (
              <div key={r.label} className="flex justify-between text-sm">
                <span className={r.isDeduction ? 'text-red-600' : 'text-foreground'}>
                  {r.label} {r.note && <span className="text-muted-foreground text-xs">({r.note})</span>}
                </span>
                <span className={r.isDeduction ? 'text-red-600 font-medium' : 'font-medium'}>
                  {r.isDeduction ? '-' : '+'}{`₹${Math.abs(r.value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                </span>
              </div>
            ))}
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>Net Payable</span>
            <span className="text-primary">{`₹${settlement.netPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}</span>
          </div>
          {settlement.notes && <p className="text-muted-foreground text-xs border-t pt-3">{settlement.notes}</p>}
          {settlement.approvedBy && (
            <p className="text-muted-foreground text-xs">
              Approved by {settlement.approvedBy.firstName} {settlement.approvedBy.lastName} on {fmtDate(settlement.approvedAt)}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
