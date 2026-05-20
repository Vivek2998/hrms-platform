import { useState } from 'react';
import { Crown, Plus, ChevronDown, ChevronUp, UserPlus, Trash2 } from 'lucide-react';
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
  useSuccessionPlans, useCreateSuccessionPlan,
  useAddSuccessionNominee, useRemoveSuccessionNominee,
} from '@/hooks/useSuccession';
import { useAuthStore } from '@/stores/auth.store';

const READINESS_META: Record<string, { label: string; color: string }> = {
  READY_NOW: { label: 'Ready Now', color: 'bg-green-100 text-green-700' },
  ONE_TO_TWO_YEARS: { label: '1-2 Years', color: 'bg-yellow-100 text-yellow-700' },
  THREE_TO_FIVE_YEARS: { label: '3-5 Years', color: 'bg-orange-100 text-orange-700' },
};

const RISK_META: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Low Risk', color: 'bg-green-100 text-green-700' },
  MEDIUM: { label: 'Medium Risk', color: 'bg-yellow-100 text-yellow-700' },
  HIGH: { label: 'High Risk', color: 'bg-red-100 text-red-700' },
};

export default function SuccessionPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [nomineeDialogPlan, setNomineeDialogPlan] = useState<string | null>(null);
  const { data: plans, isLoading } = useSuccessionPlans();
  const removeNominee = useRemoveSuccessionNominee();
  const user = useAuthStore((s) => s.user);
  const isHR = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(user?.role ?? '');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-500" />
            Succession Planning
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Critical role succession pipeline</p>
        </div>
        {isHR && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" /> New Plan
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : !plans?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Crown className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No succession plans yet</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan: any) => {
            const risk = (RISK_META[plan.riskLevel] ?? RISK_META['MEDIUM'])!;
            const isOpen = expanded === plan.id;
            return (
              <Card key={plan.id} className="border shadow-sm">
                <CardContent className="pt-3 pb-3 px-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{plan.roleTitle}</p>
                        {plan.isCritical && <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">Critical</Badge>}
                        <Badge variant="outline" className={`text-xs ${risk.color}`}>{risk.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {plan._count?.successors ?? 0} successor{plan._count?.successors !== 1 ? 's' : ''}
                        {plan.notes && ` · ${plan.notes}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isHR && (
                        <button className="text-muted-foreground hover:text-primary"
                          onClick={() => setNomineeDialogPlan(plan.id)}>
                          <UserPlus className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => setExpanded(isOpen ? null : plan.id)} className="text-muted-foreground hover:text-foreground">
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {isOpen && plan.successors?.length > 0 && (
                    <div className="mt-3 border-t pt-3 space-y-2">
                      {plan.successors.map((s: any) => {
                        const readiness = (READINESS_META[s.readiness] ?? READINESS_META['ONE_TO_TWO_YEARS'])!;
                        return (
                          <div key={s.employeeId} className="flex items-center justify-between gap-3 py-1">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                {s.employee?.firstName?.[0]}{s.employee?.lastName?.[0]}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{s.employee?.firstName} {s.employee?.lastName}</p>
                                <p className="text-xs text-muted-foreground">{s.employee?.designation}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`text-xs ${readiness.color}`}>{readiness.label}</Badge>
                              {isHR && (
                                <button className="text-muted-foreground hover:text-red-500"
                                  onClick={() => removeNominee.mutate({ planId: plan.id, employeeId: s.employeeId })}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreatePlanDialog open={showCreate} onClose={() => setShowCreate(false)} />
      <AddNomineeDialog planId={nomineeDialogPlan} onClose={() => setNomineeDialogPlan(null)} />
    </div>
  );
}

function CreatePlanDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [roleTitle, setRoleTitle] = useState('');
  const [riskLevel, setRiskLevel] = useState('MEDIUM');
  const [isCritical, setIsCritical] = useState(true);
  const [notes, setNotes] = useState('');
  const create = useCreateSuccessionPlan();

  async function handleSubmit() {
    if (!roleTitle) return;
    await create.mutateAsync({ roleTitle, riskLevel, isCritical, notes: notes || undefined });
    setRoleTitle(''); setRiskLevel('MEDIUM'); setIsCritical(true); setNotes('');
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>New Succession Plan</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Role Title</Label><Input value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} /></div>
          <div>
            <Label>Risk Level</Label>
            <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)} className="w-full border rounded-md p-2 text-sm mt-1">
              <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isCritical} onChange={(e) => setIsCritical(e.target.checked)} />
            <span className="text-sm">Critical Role</span>
          </label>
          <div><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!roleTitle || create.isPending}>Create Plan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddNomineeDialog({ planId, onClose }: { planId: string | null; onClose: () => void }) {
  const [employeeId, setEmployeeId] = useState('');
  const [readiness, setReadiness] = useState('ONE_TO_TWO_YEARS');
  const [notes, setNotes] = useState('');
  const add = useAddSuccessionNominee();

  async function handleSubmit() {
    if (!planId || !employeeId) return;
    await add.mutateAsync({ planId, employeeId, readiness, ...(notes ? { notes } : {}) });
    setEmployeeId(''); setNotes('');
    onClose();
  }

  return (
    <Dialog open={!!planId} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add Successor</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Employee ID</Label><Input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} /></div>
          <div>
            <Label>Readiness</Label>
            <select value={readiness} onChange={(e) => setReadiness(e.target.value)} className="w-full border rounded-md p-2 text-sm mt-1">
              <option value="READY_NOW">Ready Now</option>
              <option value="ONE_TO_TWO_YEARS">1-2 Years</option>
              <option value="THREE_TO_FIVE_YEARS">3-5 Years</option>
            </select>
          </div>
          <div><Label>Notes</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!employeeId || add.isPending}>Add Successor</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
