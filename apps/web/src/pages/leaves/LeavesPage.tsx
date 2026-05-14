import { useState, useEffect } from 'react';
import { Plus, CheckCircle, XCircle, ChevronLeft, ChevronRight, Pencil, Zap, Download, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useLeaves, useApproveLeave } from '@/hooks/useLeaves';
import { downloadCsv } from '@/lib/downloadCsv';
import { toast } from 'sonner';
import type { LeaveRecord } from '@/hooks/useLeaves';
import { LeaveTypesPanel } from './LeaveTypesPage';
import {
  useLeaveBalances,
  useUpsertLeaveBalance,
  useInitializeLeaveBalances,
  useCarryForwardLeaveBalances,
  type EmployeeLeaveBalance,
} from '@/hooks/useLeaveBalance';
import { useLeaveTypes } from '@/hooks/useLeaveTypes';
import type { LeaveStatus } from '@hrms/shared-types';

type Section = 'requests' | 'types' | 'balances';
type Tab = 'ALL' | LeaveStatus;

const STATUS_TABS: { label: string; value: Tab }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

function statusVariant(status: LeaveStatus) {
  switch (status) {
    case 'APPROVED':
      return 'success';
    case 'REJECTED':
      return 'destructive';
    case 'PENDING':
      return 'warning';
    default:
      return 'secondary';
  }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

interface ApprovalTarget {
  leave: LeaveRecord;
  action: 'APPROVED' | 'REJECTED';
}

function ApproveDialog({
  target,
  onClose,
}: {
  target: ApprovalTarget | null;
  onClose: () => void;
}) {
  const [remarks, setRemarks] = useState('');
  const approveMutation = useApproveLeave();

  if (!target) return null;
  const { leave, action } = target;

  function handleConfirm() {
    approveMutation.mutate(
      { id: leave.id, action, ...(remarks.trim() ? { remarks: remarks.trim() } : {}) },
      {
        onSuccess: () => {
          setRemarks('');
          onClose();
        },
      },
    );
  }

  const isReject = action === 'REJECTED';

  return (
    <Dialog
      open={!!target}
      onOpenChange={(o) => {
        if (!o) {
          setRemarks('');
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isReject ? 'Reject Leave Request' : 'Approve Leave Request'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="bg-muted/40 rounded-lg p-3 text-sm">
            <p className="font-medium">
              {leave.employee
                ? `${leave.employee.firstName} ${leave.employee.lastName}`
                : leave.employeeId.slice(0, 8)}
              {leave.employee && (
                <span className="text-muted-foreground ml-1 font-normal">
                  · {leave.employee.employeeCode}
                </span>
              )}
            </p>
            <p className="text-muted-foreground mt-0.5">
              {leave.leaveType?.name ?? 'Leave'} · {fmtDate(leave.fromDate)} –{' '}
              {fmtDate(leave.toDate)} · {leave.totalDays} day{leave.totalDays !== 1 ? 's' : ''}
            </p>
            {leave.reason && (
              <p className="mt-1 text-xs italic">&ldquo;{leave.reason}&rdquo;</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>
              Remarks{isReject ? ' *' : ' (optional)'}
            </Label>
            <Textarea
              value={remarks}
              onChange={(e) => { setRemarks(e.target.value); }}
              placeholder={
                isReject
                  ? 'Explain the reason for rejection…'
                  : 'Add a note for the employee (optional)…'
              }
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setRemarks('');
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            variant={isReject ? 'destructive' : 'default'}
            disabled={approveMutation.isPending || (isReject && !remarks.trim())}
            onClick={handleConfirm}
          >
            {approveMutation.isPending
              ? 'Saving…'
              : isReject
                ? 'Reject'
                : 'Approve'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Leave Balance Panel ──────────────────────────────────────────────────

interface EditBalanceTarget {
  employee: EmployeeLeaveBalance;
  balance: EmployeeLeaveBalance['leaveBalances'][number] | null;
  leaveTypeId: string;
  leaveTypeName: string;
  year: number;
}

function EditBalanceDialog({
  target,
  onClose,
}: {
  target: EditBalanceTarget | null;
  onClose: () => void;
}) {
  const [allocated, setAllocated] = useState<string>('');
  const upsertMutation = useUpsertLeaveBalance();

  useEffect(() => {
    if (target) setAllocated(String(target.balance?.allocated ?? 0));
  }, [target]);

  if (!target) return null;

  function handleSave() {
    const val = parseFloat(allocated);
    if (isNaN(val) || val < 0) return;
    upsertMutation.mutate(
      {
        employeeId:  target.employee.id,
        leaveTypeId: target.leaveTypeId,
        year:        target.year,
        allocated:   val,
      },
      { onSuccess: () => { onClose(); } },
    );
  }

  return (
    <Dialog
      open={!!target}
      onOpenChange={(o) => { if (!o) onClose(); }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Leave Allocation</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="bg-muted/40 rounded-lg p-3 text-sm">
            <p className="font-medium">
              {target.employee.firstName} {target.employee.lastName}
              <span className="text-muted-foreground ml-1 font-normal">· {target.employee.employeeCode}</span>
            </p>
            <p className="text-muted-foreground mt-0.5">{target.leaveTypeName} · {target.year}</p>
          </div>
          <div className="space-y-1">
            <Label>Allocated Days</Label>
            <Input
              type="number"
              min={0}
              step={0.5}
              value={allocated}
              onChange={(e) => { setAllocated(e.target.value); }}
            />
            {target.balance && (
              <p className="text-muted-foreground text-xs">
                Used: {target.balance.used} · Pending: {target.balance.pending}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={upsertMutation.isPending}>
            {upsertMutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LeaveBalancesPanel() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [editTarget, setEditTarget] = useState<EditBalanceTarget | null>(null);

  const { data, isLoading } = useLeaveBalances(year);
  const { data: leaveTypes = [] } = useLeaveTypes();
  const initMutation = useInitializeLeaveBalances();
  const carryMutation = useCarryForwardLeaveBalances();

  const employees = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {/* Year nav */}
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => { setYear((y) => y - 1); }}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[60px] text-center text-sm font-semibold">{year}</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => { setYear((y) => y + 1); }}
            disabled={year >= now.getFullYear() + 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={carryMutation.isPending}
            title={`Copy unused balance from ${year - 1} → ${year} for carry-forward leave types`}
            onClick={() => { carryMutation.mutate({ fromYear: year - 1, toYear: year }); }}
          >
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            {carryMutation.isPending ? 'Carrying…' : `Carry Forward from ${year - 1}`}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={initMutation.isPending}
            onClick={() => { initMutation.mutate(year); }}
          >
            <Zap className="mr-2 h-4 w-4" />
            {initMutation.isPending ? 'Initializing…' : 'Initialize Balances'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Balances — {year}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : employees.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <p className="text-muted-foreground text-sm">No balance records for {year}.</p>
              <Button variant="outline" size="sm" onClick={() => { initMutation.mutate(year); }}>
                <Zap className="mr-2 h-4 w-4" />
                Initialize for all employees
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground border-b text-left text-xs font-medium">
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Leave Type</th>
                    <th className="px-4 py-3">Allocated</th>
                    <th className="px-4 py-3">Used</th>
                    <th className="px-4 py-3">Pending</th>
                    <th className="px-4 py-3">Remaining</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {employees.flatMap((emp) => {
                    const rows = emp.leaveBalances.length > 0
                      ? emp.leaveBalances
                      : leaveTypes.map((lt) => ({
                          id: '',
                          leaveTypeId: lt.id,
                          leaveType: { id: lt.id, name: lt.name, code: lt.code },
                          year,
                          allocated: 0,
                          used: 0,
                          pending: 0,
                          carried: 0,
                        }));

                    return rows.map((bal, idx) => (
                      <tr key={`${emp.id}-${bal.leaveTypeId}`} className="hover:bg-muted/30">
                        {idx === 0 ? (
                          <td className="px-4 py-3" rowSpan={rows.length}>
                            <p className="font-medium">{emp.firstName} {emp.lastName}</p>
                            <p className="text-muted-foreground text-xs">{emp.employeeCode}</p>
                          </td>
                        ) : null}
                        <td className="px-4 py-3">{bal.leaveType.name}</td>
                        <td className="px-4 py-3 font-medium">{bal.allocated}</td>
                        <td className="text-muted-foreground px-4 py-3">{bal.used}</td>
                        <td className="text-muted-foreground px-4 py-3">{bal.pending}</td>
                        <td className="px-4 py-3 font-medium text-green-700">
                          {Math.max(0, bal.allocated - bal.used - bal.pending)}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditTarget({
                                employee:       emp,
                                balance:        bal.id ? bal : null,
                                leaveTypeId:    bal.leaveTypeId,
                                leaveTypeName:  bal.leaveType.name,
                                year,
                              });
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <EditBalanceDialog target={editTarget} onClose={() => { setEditTarget(null); }} />
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function LeavesPage() {
  const [section, setSection] = useState<Section>('requests');
  const [tab, setTab] = useState<Tab>('PENDING');
  const [showAddType, setShowAddType] = useState(false);
  const [approvalTarget, setApprovalTarget] = useState<ApprovalTarget | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  async function handleExportLeaves() {
    setIsExporting(true);
    try {
      const year = new Date().getFullYear();
      await downloadCsv('/reports/leaves', { year }, `leaves_${year}.csv`);
    } catch {
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  }

  const { data, isLoading } = useLeaves({
    limit: 50,
    ...(tab !== 'ALL' ? { status: tab } : {}),
  });

  const sectionLabel = section === 'requests' ? 'Leave Management' : section === 'types' ? 'Leave Types' : 'Leave Balances';
  const sectionDesc = section === 'requests'
    ? `${data?.meta.total ?? '—'} requests`
    : section === 'types'
      ? 'Configure leave categories and entitlements'
      : 'View and manage employee leave allocations';

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{sectionLabel}</h1>
          <p className="text-muted-foreground">{sectionDesc}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {section === 'requests' && (
            <Button variant="outline" size="sm" disabled={isExporting} onClick={() => { void handleExportLeaves(); }}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              {isExporting ? 'Exporting…' : 'Export CSV'}
            </Button>
          )}
          {section === 'types' && (
            <Button onClick={() => { setShowAddType(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Leave Type
            </Button>
          )}
          {/* Section toggle */}
          <div className="bg-muted/30 flex gap-1 rounded-lg border p-1">
            {(['requests', 'types', 'balances'] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setSection(s); }}
                className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                  section === s
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {s === 'requests' ? 'Requests' : s === 'types' ? 'Leave Types' : 'Balances'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {section === 'types' ? (
        <LeaveTypesPanel showAdd={showAddType} onCloseAdd={() => { setShowAddType(false); }} />
      ) : section === 'balances' ? (
        <LeaveBalancesPanel />
      ) : (
        <>
          {/* Status filter tabs */}
          <div className="overflow-x-auto">
          <div className="bg-muted/30 flex w-max gap-1 rounded-lg border p-1">
            {STATUS_TABS.map((t) => (
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
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Leave Requests</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-3 p-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : data?.data.length === 0 ? (
                <p className="text-muted-foreground py-12 text-center text-sm">
                  No {tab !== 'ALL' ? tab.toLowerCase() : ''} leave requests found.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 text-muted-foreground border-b text-left text-xs font-medium">
                        <th className="px-4 py-3">Employee</th>
                        <th className="px-4 py-3">Leave Type</th>
                        <th className="px-4 py-3">From</th>
                        <th className="px-4 py-3">To</th>
                        <th className="px-4 py-3">Days</th>
                        <th className="px-4 py-3">Applied On</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data?.data.map((leave) => (
                        <tr key={leave.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <p className="font-medium">
                              {leave.employee
                                ? `${leave.employee.firstName} ${leave.employee.lastName}`
                                : leave.employeeId.slice(0, 8)}
                            </p>
                            {leave.employee && (
                              <p className="text-muted-foreground text-xs">
                                {leave.employee.employeeCode}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">{leave.leaveType?.name ?? '—'}</td>
                          <td className="text-muted-foreground px-4 py-3">{fmtDate(leave.fromDate)}</td>
                          <td className="text-muted-foreground px-4 py-3">{fmtDate(leave.toDate)}</td>
                          <td className="px-4 py-3">{leave.totalDays}</td>
                          <td className="text-muted-foreground px-4 py-3">
                            {fmtDate(leave.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={statusVariant(leave.status)}>{leave.status}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            {leave.status === 'PENDING' && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 gap-1 border-green-600 text-green-700 hover:bg-green-50"
                                  onClick={() => { setApprovalTarget({ leave, action: 'APPROVED' }); }}
                                >
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 gap-1 border-red-600 text-red-700 hover:bg-red-50"
                                  onClick={() => { setApprovalTarget({ leave, action: 'REJECTED' }); }}
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  Reject
                                </Button>
                              </div>
                            )}
                            {leave.approvals?.[0]?.remarks && (
                              <p className="text-muted-foreground mt-0.5 max-w-[200px] truncate text-xs">
                                {leave.approvals[0].remarks}
                              </p>
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
        </>
      )}

      <ApproveDialog
        target={approvalTarget}
        onClose={() => { setApprovalTarget(null); }}
      />
    </div>
  );
}
