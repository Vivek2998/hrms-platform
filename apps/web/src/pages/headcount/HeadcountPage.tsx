import { useState } from 'react';
import { Users, Plus, Briefcase } from 'lucide-react';
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
  useHeadcountPlans, useCreateHeadcountPlan,
  useOpenPositions, useCreateOpenPosition, useUpdateOpenPosition,
} from '@/hooks/useHeadcount';
import { useAuthStore } from '@/stores/auth.store';
import { format } from 'date-fns';

const STATUS_META: Record<string, { label: string; color: string }> = {
  OPEN: { label: 'Open', color: 'bg-blue-100 text-blue-700' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-700' },
  FILLED: { label: 'Filled', color: 'bg-green-100 text-green-700' },
  ON_HOLD: { label: 'On Hold', color: 'bg-gray-100 text-gray-600' },
};

export default function HeadcountPage() {
  const [tab, setTab] = useState<'plans' | 'positions'>('plans');
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [showPositionDialog, setShowPositionDialog] = useState(false);
  const { data: plans, isLoading: plansLoading } = useHeadcountPlans();
  const { data: positions, isLoading: positionsLoading } = useOpenPositions();
  const updatePosition = useUpdateOpenPosition();
  const user = useAuthStore((s) => s.user);
  const isHR = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(user?.role ?? '');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-500" />
            Headcount Planning
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Workforce planning and open positions</p>
        </div>
        {isHR && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowPlanDialog(true)}>
              <Plus className="w-4 h-4 mr-1" /> Plan
            </Button>
            <Button onClick={() => setShowPositionDialog(true)}>
              <Plus className="w-4 h-4 mr-1" /> Position
            </Button>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {(['plans', 'positions'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}>
            {t === 'plans' ? 'Headcount Plans' : 'Open Positions'}
          </button>
        ))}
      </div>

      {tab === 'plans' && (
        <>
          {plansLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
          ) : !plans?.length ? (
            <div className="text-center py-20 text-muted-foreground">No headcount plans yet.</div>
          ) : (
            <div className="space-y-3">
              {plans.map((p: any) => (
                <Card key={p.id} className="border shadow-sm">
                  <CardContent className="py-3 px-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{p.department?.name ?? 'All Departments'} — {p.quarter}</p>
                      <p className="text-xs text-muted-foreground">
                        Planned: <strong>{p.plannedHeadcount}</strong> · Budget: {p.budget ? `₹${p.budget?.toLocaleString()}` : 'N/A'}
                        {p.notes && ` · ${p.notes}`}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">{p.year}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'positions' && (
        <>
          {positionsLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
          ) : !positions?.length ? (
            <div className="text-center py-20 text-muted-foreground">No open positions yet.</div>
          ) : (
            <div className="space-y-3">
              {positions.map((pos: any) => {
                const meta = (STATUS_META[pos.status] ?? STATUS_META['OPEN'])!;
                return (
                  <Card key={pos.id} className="border shadow-sm">
                    <CardContent className="py-3 px-4 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-muted-foreground" />
                          <p className="font-semibold text-sm">{pos.title}</p>
                          <Badge variant="outline" className={`text-xs ${meta.color}`}>{meta.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {pos.department?.name && `${pos.department.name} · `}
                          {pos.location && `${pos.location} · `}
                          {pos.type && pos.type}
                          {pos.targetDate && ` · Target: ${format(new Date(pos.targetDate), 'dd MMM yyyy')}`}
                        </p>
                      </div>
                      {isHR && pos.status !== 'FILLED' && (
                        <Button size="sm" variant="outline" className="shrink-0 text-green-600 border-green-300"
                          disabled={updatePosition.isPending}
                          onClick={() => updatePosition.mutate({ id: pos.id, status: 'FILLED' })}>
                          Mark Filled
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      <CreatePlanDialog open={showPlanDialog} onClose={() => setShowPlanDialog(false)} />
      <CreatePositionDialog open={showPositionDialog} onClose={() => setShowPositionDialog(false)} />
    </div>
  );
}

function CreatePlanDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [quarter, setQuarter] = useState('Q1');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [plannedHeadcount, setPlannedHeadcount] = useState('');
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');
  const create = useCreateHeadcountPlan();

  async function handleSubmit() {
    if (!plannedHeadcount) return;
    await create.mutateAsync({ quarter, year: Number(year), plannedHeadcount: Number(plannedHeadcount), budget: budget ? Number(budget) : undefined, notes: notes || undefined });
    setPlannedHeadcount(''); setBudget(''); setNotes('');
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>New Headcount Plan</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Quarter</Label>
              <select value={quarter} onChange={(e) => setQuarter(e.target.value)} className="w-full border rounded-md p-2 text-sm mt-1">
                {['Q1','Q2','Q3','Q4'].map((q) => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
            <div><Label>Year</Label><Input value={year} onChange={(e) => setYear(e.target.value)} /></div>
          </div>
          <div><Label>Planned Headcount</Label><Input type="number" value={plannedHeadcount} onChange={(e) => setPlannedHeadcount(e.target.value)} /></div>
          <div><Label>Budget (₹)</Label><Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} /></div>
          <div><Label>Notes</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!plannedHeadcount || create.isPending}>Create Plan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreatePositionDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('FULL_TIME');
  const [targetDate, setTargetDate] = useState('');
  const [description, setDescription] = useState('');
  const create = useCreateOpenPosition();

  async function handleSubmit() {
    if (!title) return;
    await create.mutateAsync({ title, location: location || undefined, type, targetDate: targetDate || undefined, description: description || undefined });
    setTitle(''); setLocation(''); setType('FULL_TIME'); setTargetDate(''); setDescription('');
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Open Position</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Job Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div><Label>Location</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} /></div>
          <div>
            <Label>Type</Label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border rounded-md p-2 text-sm mt-1">
              {['FULL_TIME','PART_TIME','CONTRACT','INTERN'].map((t) => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
            </select>
          </div>
          <div><Label>Target Hire Date</Label><Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} /></div>
          <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!title || create.isPending}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
