import { useState } from 'react';
import { Wallet, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useEWARequests, useCreateEWARequest, useUpdateEWAStatus } from '@/hooks/useEWA';
import { useAuthStore } from '@/stores/auth.store';
import { format } from 'date-fns';

const STATUS_META: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700' },
  APPROVED: { label: 'Approved', className: 'bg-blue-100 text-blue-700' },
  DISBURSED: { label: 'Disbursed', className: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
  REPAID: { label: 'Repaid', className: 'bg-gray-100 text-gray-500' },
};

function fmtINR(amount: number) {
  return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
}

export default function EWAPage() {
  const user = useAuthStore((s) => s.user);
  const isHR = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(user?.role ?? '');

  const { data: requests = [], isLoading } = useEWARequests(isHR);
  const createRequest = useCreateEWARequest();
  const updateStatus = useUpdateEWAStatus();

  const [showDialog, setShowDialog] = useState(false);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  async function handleCreate() {
    if (!amount || isNaN(Number(amount))) return;
    await createRequest.mutateAsync({ amount: Number(amount), notes: notes || undefined });
    setAmount('');
    setNotes('');
    setShowDialog(false);
  }

  function handleAction(id: string, status: string) {
    updateStatus.mutate({ id, status });
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
            <Wallet className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Earned Wage Access</h1>
            <p className="text-sm text-muted-foreground">
              {isHR ? 'Manage advance requests from employees' : 'Request an advance on your earned wages'}
            </p>
          </div>
        </div>
        {!isHR && (
          <Button onClick={() => setShowDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Request Advance
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Wallet className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No advance requests</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {isHR ? 'No requests have been submitted yet.' : 'Submit a request to get started.'}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                {isHR && (
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Employee</th>
                )}
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Notes</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Requested On</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                {isHR && (
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {requests.map((req: any) => {
                const meta = STATUS_META[req.status] ?? STATUS_META['PENDING'];
                return (
                  <tr key={req.id} className="hover:bg-muted/20">
                    {isHR && (
                      <td className="px-4 py-3 font-medium">
                        {req.employee?.firstName} {req.employee?.lastName}
                        <div className="text-xs text-muted-foreground">
                          {req.employee?.employeeCode}
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-3 font-semibold">{fmtINR(req.amount)}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                      {req.notes ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {format(new Date(req.createdAt), 'dd MMM yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={meta.className}>
                        {meta.label}
                      </Badge>
                    </td>
                    {isHR && (
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {req.status === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-green-600 border-green-200 hover:bg-green-50"
                                disabled={updateStatus.isPending}
                                onClick={() => handleAction(req.id, 'APPROVED')}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                disabled={updateStatus.isPending}
                                onClick={() => handleAction(req.id, 'REJECTED')}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {req.status === 'APPROVED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                              disabled={updateStatus.isPending}
                              onClick={() => handleAction(req.id, 'DISBURSED')}
                            >
                              Mark Disbursed
                            </Button>
                          )}
                          {req.status === 'DISBURSED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              disabled={updateStatus.isPending}
                              onClick={() => handleAction(req.id, 'REPAID')}
                            >
                              Mark Repaid
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Wage Advance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Amount (₹) *</Label>
              <Input
                type="number"
                placeholder="e.g. 10000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={1}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                placeholder="Reason for advance (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!amount || createRequest.isPending}
            >
              {createRequest.isPending ? 'Submitting…' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
