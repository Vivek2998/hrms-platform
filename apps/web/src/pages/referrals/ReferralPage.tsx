import { useState } from 'react';
import { Plus, Users, CheckCircle, Loader2, Trophy, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  useReferrals, useCreateReferral, useUpdateReferralStatus, useDeleteReferral,
} from '@/hooks/useReferrals';
import { useAuthStore } from '@/stores/auth.store';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'];

function statusVariant(status: string) {
  if (status === 'HIRED') return 'success';
  if (status === 'REJECTED') return 'destructive';
  if (status === 'SCREENING') return 'warning';
  return 'secondary';
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

type TabVal = 'ALL' | 'SUBMITTED' | 'SCREENING' | 'HIRED' | 'REJECTED';
const TABS: { label: string; value: TabVal }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Submitted', value: 'SUBMITTED' },
  { label: 'Screening', value: 'SCREENING' },
  { label: 'Hired', value: 'HIRED' },
  { label: 'Rejected', value: 'REJECTED' },
];

export default function ReferralPage() {
  const { user } = useAuthStore();
  const isHr = HR_ROLES.includes(user?.role ?? '');
  const [tab, setTab] = useState<TabVal>('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [statusTarget, setStatusTarget] = useState<any>(null);

  const { data: referrals = [], isLoading } = useReferrals();
  const deleteMutation = useDeleteReferral();

  const filtered = tab === 'ALL' ? referrals : referrals.filter((r: any) => r.status === tab);
  const hiredCount = referrals.filter((r: any) => r.status === 'HIRED').length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Employee Referrals</h1>
          <p className="text-muted-foreground text-sm">Refer great people to your team and earn rewards</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" /> Refer Someone
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-primary/10 rounded-full p-2"><Users className="text-primary h-5 w-5" /></div>
            <div><p className="text-muted-foreground text-xs">Total Referrals</p><p className="text-2xl font-bold">{referrals.length}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-green-100 rounded-full p-2"><Trophy className="text-green-600 h-5 w-5" /></div>
            <div><p className="text-muted-foreground text-xs">Successful Hires</p><p className="text-2xl font-bold">{hiredCount}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-amber-100 rounded-full p-2"><IndianRupee className="text-amber-600 h-5 w-5" /></div>
            <div>
              <p className="text-muted-foreground text-xs">Bonus Earned</p>
              <p className="text-2xl font-bold">
                ₹{referrals.filter((r: any) => r.bonusPaid).reduce((s: number, r: any) => s + (r.bonusAmount ?? 0), 0).toLocaleString('en-IN')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-lg border p-1 w-fit">
        {TABS.map(t => (
          <button key={t.value} onClick={() => setTab(t.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}>{t.label}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Users className="text-muted-foreground h-10 w-10" />
            <p className="text-muted-foreground text-sm">No referrals yet — refer someone great!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((ref: any) => (
            <Card key={ref.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{ref.candidateName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{ref.candidateName}</p>
                      <p className="text-muted-foreground text-xs">{ref.candidateEmail} · {ref.position}</p>
                      {isHr && <p className="text-muted-foreground text-xs mt-0.5">
                        Referred by {ref.referrer?.firstName} {ref.referrer?.lastName} on {fmtDate(ref.createdAt)}
                      </p>}
                      {ref.message && <p className="text-muted-foreground text-xs mt-1 italic">"{ref.message}"</p>}
                      {ref.bonusAmount && (
                        <p className="text-xs mt-1 text-amber-600 font-medium">
                          Bonus: ₹{ref.bonusAmount.toLocaleString('en-IN')} {ref.bonusPaid ? '✓ Paid' : '(pending)'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={statusVariant(ref.status) as any}>{ref.status}</Badge>
                    {isHr && (
                      <Button size="sm" variant="outline" onClick={() => setStatusTarget(ref)}>
                        Update Status
                      </Button>
                    )}
                    {!isHr && ref.status === 'SUBMITTED' && (
                      <Button size="sm" variant="outline"
                        disabled={deleteMutation.isPending}
                        onClick={() => deleteMutation.mutate(ref.id)}>
                        Withdraw
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateReferralDialog open={showCreate} onClose={() => setShowCreate(false)} />
      <UpdateStatusDialog referral={statusTarget} onClose={() => setStatusTarget(null)} />
    </div>
  );
}

function CreateReferralDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ candidateName: '', candidateEmail: '', candidatePhone: '', position: '', message: '' });
  const createMutation = useCreateReferral();
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Refer a Candidate</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Full Name <span className="text-destructive">*</span></Label>
              <Input className="mt-1.5" value={form.candidateName} onChange={e => set('candidateName', e.target.value)} />
            </div>
            <div>
              <Label>Email <span className="text-destructive">*</span></Label>
              <Input type="email" className="mt-1.5" value={form.candidateEmail} onChange={e => set('candidateEmail', e.target.value)} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input className="mt-1.5" placeholder="+91 98765 43210" value={form.candidatePhone} onChange={e => set('candidatePhone', e.target.value)} />
            </div>
            <div>
              <Label>Position <span className="text-destructive">*</span></Label>
              <Input className="mt-1.5" placeholder="e.g. Software Engineer" value={form.position} onChange={e => set('position', e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Why are you recommending them?</Label>
            <Textarea className="mt-1.5" rows={3} value={form.message} onChange={e => set('message', e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!form.candidateName || !form.candidateEmail || !form.position || createMutation.isPending}
            onClick={() => createMutation.mutate({
              candidateName: form.candidateName,
              candidateEmail: form.candidateEmail,
              candidatePhone: form.candidatePhone || undefined,
              position: form.position,
              message: form.message || undefined,
            }, { onSuccess: onClose })}
          >
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Referral'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UpdateStatusDialog({ referral, onClose }: { referral: any; onClose: () => void }) {
  const [status, setStatus] = useState('');
  const [bonusAmount, setBonusAmount] = useState('');
  const [bonusPaid, setBonusPaid] = useState(false);
  const updateMutation = useUpdateReferralStatus();

  if (!referral) return null;

  return (
    <Dialog open={!!referral} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Update Referral Status</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Candidate: <strong>{referral.candidateName}</strong></p>
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="SCREENING">Screening</SelectItem>
                <SelectItem value="HIRED">Hired</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {status === 'HIRED' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Bonus Amount (₹)</Label>
                <Input type="number" className="mt-1.5" value={bonusAmount} onChange={e => setBonusAmount(e.target.value)} />
              </div>
              <div className="flex items-end pb-0.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={bonusPaid} onChange={e => setBonusPaid(e.target.checked)} className="h-4 w-4" />
                  <span className="text-sm">Mark bonus as paid</span>
                </label>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!status || updateMutation.isPending}
            onClick={() => updateMutation.mutate({
              id: referral.id,
              status,
              bonusAmount: bonusAmount ? parseFloat(bonusAmount) : undefined,
              bonusPaid: status === 'HIRED' ? bonusPaid : undefined,
            }, { onSuccess: onClose })}>
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
