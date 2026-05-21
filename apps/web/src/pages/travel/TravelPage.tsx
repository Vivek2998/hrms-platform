import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plane, Plus, CheckCircle, XCircle, Clock, Ban } from 'lucide-react';
import {
  useTravelRequests,
  useCreateTravelRequest,
  useApproveTravelRequest,
  useRejectTravelRequest,
  useCancelTravelRequest,
  type TravelRequest,
  type TravelMode,
} from '@/hooks/useTravel';
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

const TRAVEL_MODES: TravelMode[] = ['FLIGHT', 'TRAIN', 'BUS', 'CAR', 'OTHER'];
const MODE_LABELS: Record<TravelMode, string> = {
  FLIGHT: '✈ Flight', TRAIN: '🚆 Train', BUS: '🚌 Bus', CAR: '🚗 Car', OTHER: '🚀 Other',
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

const createSchema = z.object({
  purpose: z.string().min(3, 'Min 3 characters'),
  fromCity: z.string().min(1, 'Required'),
  toCity: z.string().min(1, 'Required'),
  departureDate: z.string().min(1, 'Required'),
  returnDate: z.string().optional(),
  travelMode: z.enum(['FLIGHT', 'TRAIN', 'BUS', 'CAR', 'OTHER']).optional(),
  estimatedBudget: z.coerce.number().positive().optional().or(z.literal('')),
  hotelRequired: z.boolean().optional(),
  advanceRequired: z.boolean().optional(),
  advanceAmount: z.coerce.number().positive().optional().or(z.literal('')),
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

export default function TravelPage() {
  const { user } = useAuthStore();
  const isApprover = APPROVER_ROLES.includes(user?.role ?? '');

  const { data: requests = [], isLoading } = useTravelRequests();
  const createTravel = useCreateTravelRequest();
  const approveTravel = useApproveTravelRequest();
  const rejectTravel = useRejectTravelRequest();
  const cancelTravel = useCancelTravelRequest();

  const [showCreate, setShowCreate] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<TravelRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [cancelTarget, setCancelTarget] = useState<TravelRequest | null>(null);
  const [filterStatus, setFilterStatus] = useState('ALL');

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
  });

  const filtered = requests.filter(r => filterStatus === 'ALL' || r.status === filterStatus);

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'PENDING').length,
    approved: requests.filter(r => r.status === 'APPROVED').length,
    rejected: requests.filter(r => r.status === 'REJECTED').length,
  };

  async function onCreate(data: CreateForm) {
    try {
      await createTravel.mutateAsync({
        purpose: data.purpose,
        fromCity: data.fromCity,
        toCity: data.toCity,
        departureDate: data.departureDate,
        returnDate: data.returnDate || undefined,
        travelMode: data.travelMode,
        estimatedBudget: data.estimatedBudget ? Number(data.estimatedBudget) : undefined,
        hotelRequired: data.hotelRequired ?? false,
        advanceRequired: data.advanceRequired ?? false,
        advanceAmount: data.advanceAmount ? Number(data.advanceAmount) : undefined,
        notes: data.notes,
      });
      toast.success('Travel request submitted');
      setShowCreate(false);
      reset();
    } catch {
      toast.error('Failed to submit request');
    }
  }

  async function onApprove(id: string) {
    try {
      await approveTravel.mutateAsync(id);
      toast.success('Request approved');
    } catch {
      toast.error('Failed to approve');
    }
  }

  async function onReject() {
    if (!rejectTarget) return;
    try {
      await rejectTravel.mutateAsync({ id: rejectTarget.id, reason: rejectReason });
      toast.success('Request rejected');
      setRejectTarget(null);
      setRejectReason('');
    } catch {
      toast.error('Failed to reject');
    }
  }

  async function onCancel() {
    if (!cancelTarget) return;
    try {
      await cancelTravel.mutateAsync(cancelTarget.id);
      toast.success('Request cancelled');
      setCancelTarget(null);
    } catch {
      toast.error('Failed to cancel');
    }
  }

  const fmtDate = (d: string | null) => d ? format(new Date(d), 'dd MMM yyyy') : '—';

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <Plane className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Travel Requests</h1>
            <p className="text-sm text-muted-foreground">Manage business travel</p>
          </div>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Request
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Plane} label="Total" value={stats.total} color="bg-blue-100 text-blue-600" />
        <StatCard icon={Clock} label="Pending" value={stats.pending} color="bg-yellow-100 text-yellow-600" />
        <StatCard icon={CheckCircle} label="Approved" value={stats.approved} color="bg-green-100 text-green-600" />
        <StatCard icon={XCircle} label="Rejected" value={stats.rejected} color="bg-red-100 text-red-600" />
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filterStatus === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No travel requests found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  {isApprover && <th className="px-4 py-3 text-left font-medium text-muted-foreground">Employee</th>}
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Route</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Purpose</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Dates</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Mode</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Budget</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(req => {
                  const isOwn = req.employeeId === (user as any)?.employeeId;
                  return (
                    <tr key={req.id} className="hover:bg-muted/20">
                      {isApprover && (
                        <td className="px-4 py-3">
                          <span className="font-medium">{req.employee.firstName} {req.employee.lastName}</span>
                          <br />
                          <span className="text-xs text-muted-foreground">{req.employee.employeeCode}</span>
                        </td>
                      )}
                      <td className="px-4 py-3 font-medium">{req.fromCity} → {req.toCity}</td>
                      <td className="px-4 py-3 max-w-[180px] truncate text-muted-foreground">{req.purpose}</td>
                      <td className="px-4 py-3">
                        <span>{fmtDate(req.departureDate)}</span>
                        {req.returnDate && <><br /><span className="text-xs text-muted-foreground">Return: {fmtDate(req.returnDate)}</span></>}
                      </td>
                      <td className="px-4 py-3">{MODE_LABELS[req.travelMode]}</td>
                      <td className="px-4 py-3">
                        {req.estimatedBudget ? `₹${Number(req.estimatedBudget).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={STATUS_STYLES[req.status]}>{req.status}</Badge>
                        {req.rejectedReason && (
                          <p className="mt-1 text-xs text-red-500">{req.rejectedReason}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {isApprover && req.status === 'PENDING' && (
                            <>
                              <Button size="sm" variant="outline" className="h-7 text-xs text-green-600 border-green-200 hover:bg-green-50"
                                onClick={() => onApprove(req.id)}>Approve</Button>
                              <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => setRejectTarget(req)}>Reject</Button>
                            </>
                          )}
                          {(isOwn || isApprover) && req.status === 'PENDING' && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground"
                              onClick={() => setCancelTarget(req)}>
                              <Ban className="h-3 w-3 mr-1" /> Cancel
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Travel Request</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
            <div>
              <Label>Purpose *</Label>
              <Textarea {...register('purpose')} placeholder="Business meeting, conference…" rows={2} />
              {errors.purpose && <p className="text-xs text-red-500 mt-1">{errors.purpose.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>From City *</Label>
                <Input {...register('fromCity')} placeholder="Mumbai" />
                {errors.fromCity && <p className="text-xs text-red-500 mt-1">{errors.fromCity.message}</p>}
              </div>
              <div>
                <Label>To City *</Label>
                <Input {...register('toCity')} placeholder="Delhi" />
                {errors.toCity && <p className="text-xs text-red-500 mt-1">{errors.toCity.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Departure Date *</Label>
                <Input type="date" {...register('departureDate')} />
                {errors.departureDate && <p className="text-xs text-red-500 mt-1">{errors.departureDate.message}</p>}
              </div>
              <div>
                <Label>Return Date</Label>
                <Input type="date" {...register('returnDate')} />
              </div>
            </div>
            <div>
              <Label>Travel Mode</Label>
              <Select onValueChange={(v) => setValue('travelMode', v as TravelMode)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  {TRAVEL_MODES.map(m => (
                    <SelectItem key={m} value={m}>{MODE_LABELS[m]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estimated Budget (₹)</Label>
              <Input type="number" {...register('estimatedBudget')} placeholder="5000" />
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" {...register('hotelRequired')} className="rounded" />
                Hotel required
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" {...register('advanceRequired')} className="rounded" />
                Advance required
              </label>
            </div>
            {watch('advanceRequired') && (
              <div>
                <Label>Advance Amount (₹)</Label>
                <Input type="number" {...register('advanceAmount')} placeholder="2000" />
              </div>
            )}
            <div>
              <Label>Notes</Label>
              <Textarea {...register('notes')} placeholder="Any additional details…" rows={2} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => { setShowCreate(false); reset(); }}>Cancel</Button>
              <Button type="submit" disabled={createTravel.isPending}>
                {createTravel.isPending ? 'Submitting…' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={() => setRejectTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reject Travel Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Rejecting request from {rejectTarget?.employee.firstName} {rejectTarget?.employee.lastName} ({rejectTarget?.fromCity} → {rejectTarget?.toCity})
            </p>
            <div>
              <Label>Reason (optional)</Label>
              <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection…" rows={3} />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
              <Button variant="destructive" onClick={onReject} disabled={rejectTravel.isPending}>
                {rejectTravel.isPending ? 'Rejecting…' : 'Reject'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirm Dialog */}
      <Dialog open={!!cancelTarget} onOpenChange={() => setCancelTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel Travel Request</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Cancel the request for {cancelTarget?.fromCity} → {cancelTarget?.toCity}? This cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setCancelTarget(null)}>Keep</Button>
            <Button variant="destructive" onClick={onCancel} disabled={cancelTravel.isPending}>
              {cancelTravel.isPending ? 'Cancelling…' : 'Cancel Request'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
