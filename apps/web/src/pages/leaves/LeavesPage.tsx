import { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLeaves, useApproveLeave } from '@/hooks/useLeaves';
import type { LeaveStatus } from '@hrms/shared-types';

type Tab = 'ALL' | LeaveStatus;

const TABS: { label: string; value: Tab }[] = [
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

export default function LeavesPage() {
  const [tab, setTab] = useState<Tab>('PENDING');
  const approveMutation = useApproveLeave();

  const { data, isLoading } = useLeaves({
    limit: 50,
    ...(tab !== 'ALL' ? { status: tab } : {}),
  });

  function handleAction(id: string, action: 'APPROVED' | 'REJECTED') {
    approveMutation.mutate({ id, action });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leave Management</h1>
          <p className="text-muted-foreground">{data?.meta.total ?? '—'} requests</p>
        </div>
      </div>

      <div className="bg-muted/30 flex w-fit gap-1 rounded-lg border p-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => {
              setTab(t.value);
            }}
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
                              disabled={approveMutation.isPending}
                              onClick={() => {
                                handleAction(leave.id, 'APPROVED');
                              }}
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1 border-red-600 text-red-700 hover:bg-red-50"
                              disabled={approveMutation.isPending}
                              onClick={() => {
                                handleAction(leave.id, 'REJECTED');
                              }}
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
    </div>
  );
}
