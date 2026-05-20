import { useState } from 'react';
import { TrendingUp, Plus, ChevronDown, ChevronUp } from 'lucide-react';
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
import { useESOPs, useMyESOPs, useCreateGrant, useExerciseOptions } from '@/hooks/useESOPs';
import { useAuthStore } from '@/stores/auth.store';
import { format } from 'date-fns';

const STATUS_META: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Active', className: 'bg-blue-100 text-blue-700' },
  VESTED: { label: 'Vested', className: 'bg-green-100 text-green-700' },
  EXERCISED: { label: 'Exercised', className: 'bg-purple-100 text-purple-700' },
  CANCELLED: { label: 'Cancelled', className: 'bg-gray-100 text-gray-500' },
  EXPIRED: { label: 'Expired', className: 'bg-red-100 text-red-700' },
};

function fmtINR(amount: number) {
  return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
}

function VestingTimeline({ schedule }: { schedule: any[] }) {
  if (!schedule?.length) return null;
  return (
    <div className="mt-3 border-t pt-3">
      <p className="text-xs font-semibold text-muted-foreground mb-2">Vesting Schedule</p>
      <div className="relative pl-4">
        <div className="absolute left-1.5 top-0 bottom-0 w-px bg-border" />
        {schedule.map((entry: any, idx: number) => (
          <div key={idx} className="relative mb-2 flex items-start gap-3">
            <div
              className={`absolute -left-2.5 mt-0.5 h-3 w-3 rounded-full border-2 border-background ${
                entry.isVested ? 'bg-green-500' : 'bg-muted-foreground/30'
              }`}
            />
            <div className="ml-2">
              <span className="text-xs text-muted-foreground">
                Month {entry.month}:{' '}
              </span>
              <span className="text-xs font-medium">{entry.options} options</span>
              {entry.vestDate && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({format(new Date(entry.vestDate), 'dd MMM yyyy')})
                </span>
              )}
              {entry.isVested && (
                <Badge variant="outline" className="ml-2 text-[10px] bg-green-100 text-green-700">
                  Vested
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ESOPPage() {
  const user = useAuthStore((s) => s.user);
  const isHR = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(user?.role ?? '');

  const { data: allGrants = [], isLoading: hrLoading } = useESOPs();
  const { data: myGrants = [], isLoading: myLoading } = useMyESOPs();
  const createGrant = useCreateGrant();
  const exerciseOptions = useExerciseOptions();

  const grants = isHR ? allGrants : myGrants;
  const isLoading = isHR ? hrLoading : myLoading;

  const [showCreate, setShowCreate] = useState(false);
  const [exerciseTarget, setExerciseTarget] = useState<any | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [grantForm, setGrantForm] = useState({
    employeeId: '',
    grantDate: '',
    optionsCount: '',
    strikePrice: '',
    cliffMonths: '12',
    totalVestMonths: '48',
    vestingScheduleJson: '',
  });

  const [exerciseForm, setExerciseForm] = useState({
    optionsCount: '',
    exercisePrice: '',
  });

  async function handleCreateGrant() {
    if (!grantForm.employeeId || !grantForm.grantDate || !grantForm.optionsCount || !grantForm.strikePrice) return;
    let vestingSchedule;
    if (grantForm.vestingScheduleJson.trim()) {
      try {
        vestingSchedule = JSON.parse(grantForm.vestingScheduleJson);
      } catch {
        return;
      }
    }
    await createGrant.mutateAsync({
      employeeId: grantForm.employeeId,
      grantDate: grantForm.grantDate,
      optionsCount: Number(grantForm.optionsCount),
      strikePrice: Number(grantForm.strikePrice),
      cliffMonths: Number(grantForm.cliffMonths),
      totalVestMonths: Number(grantForm.totalVestMonths),
      vestingSchedule,
    });
    setGrantForm({ employeeId: '', grantDate: '', optionsCount: '', strikePrice: '', cliffMonths: '12', totalVestMonths: '48', vestingScheduleJson: '' });
    setShowCreate(false);
  }

  async function handleExercise() {
    if (!exerciseTarget || !exerciseForm.optionsCount || !exerciseForm.exercisePrice) return;
    await exerciseOptions.mutateAsync({
      id: exerciseTarget.id,
      optionsCount: Number(exerciseForm.optionsCount),
      exercisePrice: Number(exerciseForm.exercisePrice),
    });
    setExerciseTarget(null);
    setExerciseForm({ optionsCount: '', exercisePrice: '' });
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">ESOP / Equity</h1>
            <p className="text-sm text-muted-foreground">
              {isHR ? 'Manage employee stock option grants' : 'Your equity grants and vesting'}
            </p>
          </div>
        </div>
        {isHR && (
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Create Grant
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : grants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <TrendingUp className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">
            {isHR ? 'No grants created yet' : 'No equity grants assigned'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {isHR
              ? 'Create your first ESOP grant to get started.'
              : 'Contact HR for information about the ESOP programme.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {grants.map((grant: any) => {
            const meta = STATUS_META[grant.status] ?? STATUS_META['ACTIVE'];
            const isOpen = expanded === grant.id;
            const vestedCount = grant.vestingSchedule?.filter((v: any) => v.isVested)
              .reduce((acc: number, v: any) => acc + (v.options ?? 0), 0) ?? 0;

            return (
              <Card key={grant.id} className="border shadow-sm">
                <CardContent className="pt-3 pb-3 px-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isHR && (
                          <p className="font-semibold text-sm">
                            {grant.employee?.firstName} {grant.employee?.lastName}
                          </p>
                        )}
                        <Badge variant="outline" className={`text-xs ${meta.className}`}>
                          {meta.label}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                        <div>
                          <span className="block font-medium text-foreground">
                            {grant.optionsCount?.toLocaleString('en-IN')}
                          </span>
                          Total Options
                        </div>
                        <div>
                          <span className="block font-medium text-foreground">
                            {fmtINR(grant.strikePrice)}
                          </span>
                          Strike Price
                        </div>
                        <div>
                          <span className="block font-medium text-green-600">
                            {vestedCount.toLocaleString('en-IN')}
                          </span>
                          Vested
                        </div>
                        <div>
                          <span className="block font-medium text-foreground">
                            {grant.grantDate
                              ? format(new Date(grant.grantDate), 'dd MMM yyyy')
                              : '—'}
                          </span>
                          Grant Date
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!isHR && grant.status === 'VESTED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-purple-600 border-purple-200 hover:bg-purple-50"
                          onClick={() => setExerciseTarget(grant)}
                        >
                          Exercise
                        </Button>
                      )}
                      <button
                        onClick={() => setExpanded(isOpen ? null : grant.id)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  {isOpen && grant.vestingSchedule?.length > 0 && (
                    <VestingTimeline schedule={grant.vestingSchedule} />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Grant Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create ESOP Grant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Employee ID *</Label>
              <Input
                value={grantForm.employeeId}
                onChange={(e) => setGrantForm((f) => ({ ...f, employeeId: e.target.value }))}
                placeholder="Enter employee ID"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Grant Date *</Label>
                <Input
                  type="date"
                  value={grantForm.grantDate}
                  onChange={(e) => setGrantForm((f) => ({ ...f, grantDate: e.target.value }))}
                />
              </div>
              <div>
                <Label>Options Count *</Label>
                <Input
                  type="number"
                  value={grantForm.optionsCount}
                  onChange={(e) => setGrantForm((f) => ({ ...f, optionsCount: e.target.value }))}
                  placeholder="e.g. 1000"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Strike Price (₹) *</Label>
                <Input
                  type="number"
                  value={grantForm.strikePrice}
                  onChange={(e) => setGrantForm((f) => ({ ...f, strikePrice: e.target.value }))}
                  placeholder="e.g. 100"
                />
              </div>
              <div>
                <Label>Cliff (months)</Label>
                <Input
                  type="number"
                  value={grantForm.cliffMonths}
                  onChange={(e) => setGrantForm((f) => ({ ...f, cliffMonths: e.target.value }))}
                />
              </div>
              <div>
                <Label>Total Vest (months)</Label>
                <Input
                  type="number"
                  value={grantForm.totalVestMonths}
                  onChange={(e) => setGrantForm((f) => ({ ...f, totalVestMonths: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Vesting Schedule (JSON, optional)</Label>
              <Textarea
                placeholder={`[\n  { "month": 12, "options": 250 },\n  { "month": 24, "options": 250 }\n]`}
                value={grantForm.vestingScheduleJson}
                onChange={(e) =>
                  setGrantForm((f) => ({ ...f, vestingScheduleJson: e.target.value }))
                }
                rows={5}
                className="font-mono text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              onClick={handleCreateGrant}
              disabled={
                !grantForm.employeeId ||
                !grantForm.grantDate ||
                !grantForm.optionsCount ||
                !grantForm.strikePrice ||
                createGrant.isPending
              }
            >
              {createGrant.isPending ? 'Creating…' : 'Create Grant'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exercise Options Dialog */}
      <Dialog open={!!exerciseTarget} onOpenChange={() => setExerciseTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Exercise Options</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You are exercising options from your grant (Strike price:{' '}
              {exerciseTarget ? fmtINR(exerciseTarget.strikePrice) : '—'}).
            </p>
            <div>
              <Label>Number of Options *</Label>
              <Input
                type="number"
                value={exerciseForm.optionsCount}
                onChange={(e) => setExerciseForm((f) => ({ ...f, optionsCount: e.target.value }))}
                placeholder="e.g. 250"
              />
            </div>
            <div>
              <Label>Exercise Price per Option (₹) *</Label>
              <Input
                type="number"
                value={exerciseForm.exercisePrice}
                onChange={(e) =>
                  setExerciseForm((f) => ({ ...f, exercisePrice: e.target.value }))
                }
                placeholder="e.g. 100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExerciseTarget(null)}>Cancel</Button>
            <Button
              onClick={handleExercise}
              disabled={
                !exerciseForm.optionsCount ||
                !exerciseForm.exercisePrice ||
                exerciseOptions.isPending
              }
            >
              {exerciseOptions.isPending ? 'Processing…' : 'Exercise'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
