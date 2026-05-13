import { useState } from 'react';
import { downloadCsv } from '@/lib/downloadCsv';
import { toast } from 'sonner';
import { Plus, Play, Eye, CheckCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  usePayrollRuns,
  useCreatePayrollRun,
  useProcessPayrollRun,
  useMarkPayrollPaid,
  useRunPayslips,
} from '@/hooks/usePayroll';
import type { PayrollRun, PayrollStatus } from '@hrms/shared-types';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function statusVariant(status: PayrollStatus) {
  switch (status) {
    case 'COMPLETED':
      return 'success';
    case 'PAID':
      return 'success';
    case 'DRAFT':
      return 'secondary';
    case 'PROCESSING':
      return 'warning';
    case 'FAILED':
      return 'destructive';
    default:
      return 'secondary';
  }
}

function fmtCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function NewRunDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const createMutation = useCreatePayrollRun();

  const years = [now.getFullYear() - 1, now.getFullYear()];

  function handleCreate() {
    createMutation.mutate({ month, year }, { onSuccess: onClose });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New Payroll Run</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Month</Label>
            <Select
              value={String(month)}
              onValueChange={(v) => {
                setMonth(Number(v));
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={i} value={String(i + 1)}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Year</Label>
            <Select
              value={String(year)}
              onValueChange={(v) => {
                setYear(Number(v));
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating…' : 'Create Draft'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PayslipListDialog({
  run,
  onClose,
}: {
  run: PayrollRun | null;
  onClose: () => void;
}) {
  const { data: payslips, isLoading } = useRunPayslips(run?.id ?? null);

  return (
    <Dialog
      open={!!run}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Payslips — {run ? `${MONTHS[run.month - 1]} ${run.year}` : ''}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !payslips?.length ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No payslips found for this run.
          </p>
        ) : (
          <div className="max-h-[480px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0">
                <tr className="bg-muted/80 text-muted-foreground border-b text-left text-xs font-medium">
                  <th className="px-4 py-2.5">Employee</th>
                  <th className="px-4 py-2.5">Days Present</th>
                  <th className="px-4 py-2.5 text-right">Gross</th>
                  <th className="px-4 py-2.5 text-right">Deductions</th>
                  <th className="px-4 py-2.5 text-right">Net Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payslips.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5">
                      <p className="font-medium">
                        {p.employee
                          ? `${p.employee.firstName} ${p.employee.lastName}`
                          : p.employeeId.slice(0, 8)}
                      </p>
                      {p.employee?.designation && (
                        <p className="text-muted-foreground text-xs">{p.employee.designation}</p>
                      )}
                    </td>
                    <td className="text-muted-foreground px-4 py-2.5">
                      {p.presentDays}/{p.workingDays}
                      {p.lopDays > 0 && (
                        <span className="text-destructive ml-1 text-xs">
                          (LOP: {p.lopDays})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">{fmtCurrency(p.grossEarnings)}</td>
                    <td className="text-destructive px-4 py-2.5 text-right">
                      -{fmtCurrency(p.totalDeductions)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold">
                      {fmtCurrency(p.netPay)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/40 border-t font-medium">
                  <td className="px-4 py-2.5 text-xs font-semibold">
                    Total ({payslips.length} employees)
                  </td>
                  <td />
                  <td className="px-4 py-2.5 text-right">
                    {fmtCurrency(payslips.reduce((s, p) => s + p.grossEarnings, 0))}
                  </td>
                  <td className="text-destructive px-4 py-2.5 text-right">
                    -{fmtCurrency(payslips.reduce((s, p) => s + p.totalDeductions, 0))}
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold">
                    {fmtCurrency(payslips.reduce((s, p) => s + p.netPay, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function PayrollPage() {
  const [showNew, setShowNew] = useState(false);
  const [viewingRun, setViewingRun] = useState<PayrollRun | null>(null);
  const { data, isLoading } = usePayrollRuns({ limit: 20 });
  const processMutation = useProcessPayrollRun();
  const markPaidMutation = useMarkPayrollPaid();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Payroll</h1>
          <p className="text-muted-foreground">{data?.meta.total ?? '—'} payroll runs</p>
        </div>
        <Button
          onClick={() => {
            setShowNew(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Payroll Run
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payroll Runs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : data?.data.length === 0 ? (
            <p className="text-muted-foreground py-12 text-center text-sm">
              No payroll runs yet. Create your first run to get started.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground border-b text-left text-xs font-medium">
                    <th className="px-4 py-3">Period</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Employees</th>
                    <th className="px-4 py-3">Gross Earnings</th>
                    <th className="px-4 py-3">Deductions</th>
                    <th className="px-4 py-3">Net Pay</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data?.data.map((run) => (
                    <tr key={run.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">
                        {MONTHS[run.month - 1]} {run.year}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant(run.status)}>{run.status}</Badge>
                      </td>
                      <td className="px-4 py-3">{run.totalEmployees}</td>
                      <td className="px-4 py-3">
                        {run.totalGross > 0 ? fmtCurrency(run.totalGross) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {run.totalDeductions > 0 ? fmtCurrency(run.totalDeductions) : '—'}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {run.totalNetPay > 0 ? fmtCurrency(run.totalNetPay) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {run.status === 'DRAFT' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1"
                              disabled={processMutation.isPending}
                              onClick={() => {
                                processMutation.mutate(run.id);
                              }}
                            >
                              <Play className="h-3.5 w-3.5" />
                              Process
                            </Button>
                          )}
                          {run.status === 'COMPLETED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1 border-green-200 text-green-700 hover:bg-green-50"
                              disabled={markPaidMutation.isPending}
                              onClick={() => { markPaidMutation.mutate(run.id); }}
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Mark Paid
                            </Button>
                          )}
                          {(run.status === 'COMPLETED' || run.status === 'PAID') && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 gap-1"
                                onClick={() => { setViewingRun(run); }}
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Payslips
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 gap-1"
                                onClick={() => {
                                  downloadCsv(
                                    '/reports/payroll',
                                    { month: run.month, year: run.year },
                                    `payroll_${run.year}_${String(run.month).padStart(2, '0')}.csv`,
                                  ).catch(() => toast.error('Export failed'));
                                }}
                              >
                                <Download className="h-3.5 w-3.5" />
                                CSV
                              </Button>
                            </>
                          )}
                          {run.processedAt && (
                            <p className="text-muted-foreground text-xs">
                              {new Date(run.processedAt).toLocaleDateString('en-IN')}
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <NewRunDialog
        open={showNew}
        onClose={() => {
          setShowNew(false);
        }}
      />

      <PayslipListDialog
        run={viewingRun}
        onClose={() => {
          setViewingRun(null);
        }}
      />
    </div>
  );
}
