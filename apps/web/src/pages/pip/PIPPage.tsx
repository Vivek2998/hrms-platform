import { useState } from 'react';
import { Target, Plus, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
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
import { usePIPs, useCreatePIP, useUpdatePIPStatus, useAddPIPCheckIn } from '@/hooks/usePIP';
import { useAuthStore } from '@/stores/auth.store';
import { format } from 'date-fns';

const STATUS_META: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Active', color: 'bg-blue-100 text-blue-700' },
  EXTENDED: { label: 'Extended', color: 'bg-yellow-100 text-yellow-700' },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-700' },
  FAILED: { label: 'Failed', color: 'bg-red-100 text-red-700' },
};

export default function PIPPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data: pips, isLoading } = usePIPs();
  const updateStatus = useUpdatePIPStatus();
  const user = useAuthStore((s) => s.user);
  const isHR = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(user?.role ?? '');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-orange-500" />
            Performance Improvement Plans
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Track and manage PIPs</p>
        </div>
        {isHR && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" /> New PIP
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
      ) : !pips?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold">No active PIPs</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {pips.map((pip: any) => {
            const meta = (STATUS_META[pip.status] ?? STATUS_META['ACTIVE'])!;
            const isOpen = expanded === pip.id;
            return (
              <Card key={pip.id} className="border shadow-sm">
                <CardContent className="pt-3 pb-3 px-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">
                          {pip.employee?.firstName} {pip.employee?.lastName}
                        </p>
                        <Badge variant="outline" className={`text-xs ${meta.color}`}>{meta.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(pip.startDate), 'dd MMM yyyy')} – {format(new Date(pip.endDate), 'dd MMM yyyy')}
                      </p>
                      <p className="text-sm mt-1 line-clamp-2">{pip.reason}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isHR && pip.status === 'ACTIVE' && (
                        <Button size="sm" variant="outline" className="text-green-600 border-green-300"
                          disabled={updateStatus.isPending}
                          onClick={() => updateStatus.mutate({ id: pip.id, status: 'COMPLETED' })}>
                          Complete
                        </Button>
                      )}
                      <button onClick={() => setExpanded(isOpen ? null : pip.id)} className="text-muted-foreground hover:text-foreground">
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-3 border-t pt-3 space-y-3">
                      {pip.goals?.length ? (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Goals</p>
                          <ul className="space-y-1">
                            {pip.goals.map((g: any) => (
                              <li key={g.id} className="text-sm flex items-start gap-2">
                                <span className={`mt-0.5 shrink-0 ${g.isCompleted ? 'text-green-500' : 'text-muted-foreground'}`}>
                                  {g.isCompleted ? '✓' : '○'}
                                </span>
                                {g.description}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {pip.checkIns?.length ? (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Check-ins</p>
                          <div className="space-y-1">
                            {pip.checkIns.map((ci: any) => (
                              <div key={ci.id} className="text-xs text-muted-foreground flex gap-2">
                                <span className="shrink-0">{format(new Date(ci.createdAt), 'dd MMM')}</span>
                                <span>{ci.note}</span>
                                {ci.progressPct != null && <span className="ml-auto">{ci.progressPct}%</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {isHR && <AddCheckInInline pipId={pip.id} />}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreatePIPDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}

function AddCheckInInline({ pipId }: { pipId: string }) {
  const [note, setNote] = useState('');
  const [pct, setPct] = useState('');
  const add = useAddPIPCheckIn();
  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1">
        <Input placeholder="Check-in note..." value={note} onChange={(e) => setNote(e.target.value)} className="text-xs h-7" />
      </div>
      <Input type="number" placeholder="%" value={pct} onChange={(e) => setPct(e.target.value)} className="w-16 text-xs h-7" />
      <Button size="sm" variant="outline" className="h-7 text-xs" disabled={!note.trim() || add.isPending}
        onClick={() => { add.mutate({ id: pipId, note, ...(pct ? { progressPct: Number(pct) } : {}) }); setNote(''); setPct(''); }}>
        Log
      </Button>
    </div>
  );
}

function CreatePIPDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [employeeId, setEmployeeId] = useState('');
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [improvementPlan, setImprovementPlan] = useState('');
  const create = useCreatePIP();

  async function handleSubmit() {
    if (!employeeId || !reason || !startDate || !endDate) return;
    await create.mutateAsync({ employeeId, reason, startDate, endDate, improvementPlan: improvementPlan || undefined });
    setEmployeeId(''); setReason(''); setStartDate(''); setEndDate(''); setImprovementPlan('');
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Create PIP</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Employee ID</Label><Input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} /></div>
          <div><Label>Reason for PIP</Label><Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Start Date</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
            <div><Label>End Date</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
          </div>
          <div><Label>Improvement Plan</Label><Textarea value={improvementPlan} onChange={(e) => setImprovementPlan(e.target.value)} rows={3} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!employeeId || !reason || !startDate || !endDate || create.isPending}>
            Create PIP
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
