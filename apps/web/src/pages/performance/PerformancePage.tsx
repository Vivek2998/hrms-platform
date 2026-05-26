import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Loader2, Target, Plus, Star, Users, BarChart3, Trophy, TrendingUp,
  CheckCircle2, AlertCircle, RefreshCw, Award, UserCheck, Zap, Eye,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  useCycles, useCreateCycle, useUpdateCycle,
  useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal,
  useReviews, useCreateReview, useInitializeReviews,
  useSubmitSelfReview, useSubmitManagerReview,
  usePeerFeedbacks, useSubmitPeerFeedback,
  useTeamOverview,
  ratingLabel, ratingColor, computeOverallScore,
  type CycleFrequency, type GoalStatus, type PerformanceReview, type EmployeePerfSummary,
} from '@/hooks/usePerformance';
import { useEmployees } from '@/hooks/useEmployees';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'];
const MANAGER_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'];

const GOAL_COLORS: Record<GoalStatus, string> = {
  NOT_STARTED: 'bg-gray-100 text-gray-600',
  IN_PROGRESS:  'bg-blue-100 text-blue-700',
  ACHIEVED:     'bg-green-100 text-green-700',
  MISSED:       'bg-red-100 text-red-700',
};

const REVIEW_STATUS_COLORS: Record<string, string> = {
  PENDING:          'bg-gray-100 text-gray-600',
  SELF_SUBMITTED:   'bg-blue-100 text-blue-700',
  MANAGER_REVIEWED: 'bg-purple-100 text-purple-700',
  COMPLETED:        'bg-green-100 text-green-700',
};

function initials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
}

function StarDisplay({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={cn('text-base', i < Math.round(value) ? 'text-yellow-500' : 'text-gray-200')}>
          ★
        </span>
      ))}
      <span className="ml-1 text-sm font-semibold text-foreground">{value.toFixed(1)}</span>
    </div>
  );
}

function StarPicker({
  value, onChange, max = 5,
}: { value: number; onChange: (v: number) => void; max?: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i + 1)}
          className={cn(
            'h-9 w-9 rounded text-xl transition-colors',
            i < value ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400',
          )}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CREATE CYCLE DIALOG
// ─────────────────────────────────────────────────────────────

function CreateCycleDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: { name: '', frequency: 'ANNUAL' as CycleFrequency, startDate: '', endDate: '' },
  });
  const { mutateAsync, isPending } = useCreateCycle();

  async function onSubmit(d: { name: string; frequency: CycleFrequency; startDate: string; endDate: string }) {
    try {
      await mutateAsync(d);
      toast.success('Cycle created');
      reset();
      onClose();
    } catch {
      toast.error('Failed to create cycle');
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Create Performance Cycle</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>Cycle Name</Label>
            <Input {...register('name', { required: true })} placeholder="e.g. Annual Review 2026" />
          </div>
          <div className="space-y-1">
            <Label>Frequency</Label>
            <Select value={watch('frequency')} onValueChange={(v) => setValue('frequency', v as CycleFrequency)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ANNUAL">Annual</SelectItem>
                <SelectItem value="HALF_YEARLY">Half-Yearly</SelectItem>
                <SelectItem value="QUARTERLY">Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Start Date</Label><Input type="date" {...register('startDate', { required: true })} /></div>
            <div className="space-y-1"><Label>End Date</Label><Input type="date" {...register('endDate', { required: true })} /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// ADD GOAL DIALOG
// ─────────────────────────────────────────────────────────────

function AddGoalDialog({
  cycleId, open, onClose, forEmployeeId,
}: {
  cycleId: string;
  open: boolean;
  onClose: () => void;
  forEmployeeId?: string; // HR/Manager assigning to someone else
}) {
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      title: '', description: '', targetValue: '', weightage: '1', dueDate: '', employeeId: forEmployeeId ?? '',
    },
  });
  const { mutateAsync, isPending } = useCreateGoal();
  const role = useAuthStore((s) => s.user?.role);
  const isManagerRole = MANAGER_ROLES.includes(role ?? '');
  const { data: employeesData } = useEmployees({ limit: 200 });

  async function onSubmit(d: {
    title: string; description: string; targetValue: string;
    weightage: string; dueDate: string; employeeId: string;
  }) {
    try {
      await mutateAsync({
        cycleId,
        title: d.title,
        ...(d.description ? { description: d.description } : {}),
        ...(d.targetValue ? { targetValue: d.targetValue } : {}),
        weightage: parseFloat(d.weightage) || 1,
        ...(d.dueDate ? { dueDate: d.dueDate } : {}),
        ...(isManagerRole && d.employeeId ? { employeeId: d.employeeId } : {}),
      });
      toast.success('Goal added');
      reset();
      onClose();
    } catch {
      toast.error('Failed to add goal');
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{forEmployeeId ? 'Assign Goal to Employee' : 'Add Goal'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {isManagerRole && !forEmployeeId && (
            <div className="space-y-1">
              <Label>Assign to (leave blank for yourself)</Label>
              <Select value={watch('employeeId')} onValueChange={(v) => setValue('employeeId', v)}>
                <SelectTrigger><SelectValue placeholder="Select employee (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Myself</SelectItem>
                  {(employeesData?.employees ?? []).map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.firstName} {e.lastName} ({e.employeeCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1">
            <Label>Goal Title *</Label>
            <Input {...register('title', { required: true })} placeholder="e.g. Improve customer satisfaction score" />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea {...register('description')} placeholder="Brief description or context" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Target / KPI</Label>
              <Input {...register('targetValue')} placeholder="e.g. 95%, ₹10L revenue" />
            </div>
            <div className="space-y-1">
              <Label>Weightage (1–10)</Label>
              <Input type="number" min="0.1" max="10" step="0.5" {...register('weightage')} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Due Date</Label>
            <Input type="date" {...register('dueDate')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add Goal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// EMPLOYEE DETAIL MODAL (for HR viewing a single employee's data)
// ─────────────────────────────────────────────────────────────

function EmployeeDetailModal({
  open, onClose, summary, cycleId,
}: {
  open: boolean;
  onClose: () => void;
  summary: EmployeePerfSummary | null;
  cycleId: string;
}) {
  const { data: goals } = useGoals(open ? cycleId : null, summary?.employee.id);
  const { data: feedbacks } = usePeerFeedbacks(open ? cycleId : null, summary?.employee.id);

  if (!summary) return null;

  const { employee, review, weightedProgress, totalGoals, achievedGoals, avgPeerRating } = summary;
  const overallScore = computeOverallScore(review as PerformanceReview | null, weightedProgress, avgPeerRating);
  const label = overallScore ? ratingLabel(overallScore) : null;
  const color = overallScore ? ratingColor(overallScore) : '';

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={employee.avatarUrl ?? undefined} />
              <AvatarFallback>{initials(employee.firstName, employee.lastName)}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle>{employee.firstName} {employee.lastName}</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {employee.employeeCode} · {employee.designation ?? 'Employee'}
                {employee.department && ` · ${employee.department.name}`}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Score Card */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Self Rating</p>
              {review?.selfRating
                ? <p className="text-xl font-bold text-blue-600">{review.selfRating.toFixed(1)}<span className="text-sm font-normal text-muted-foreground">/5</span></p>
                : <p className="text-muted-foreground text-sm">—</p>}
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Manager Rating</p>
              {review?.managerRating
                ? <p className="text-xl font-bold text-green-600">{review.managerRating.toFixed(1)}<span className="text-sm font-normal text-muted-foreground">/5</span></p>
                : <p className="text-muted-foreground text-sm">—</p>}
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Overall Score</p>
              {overallScore
                ? <p className={cn('text-xl font-bold', overallScore >= 4 ? 'text-purple-600' : overallScore >= 3 ? 'text-blue-600' : 'text-orange-600')}>
                    {overallScore.toFixed(1)}<span className="text-sm font-normal text-muted-foreground">/5</span>
                  </p>
                : <p className="text-muted-foreground text-sm">—</p>}
            </div>
          </div>

          {overallScore && label && (
            <div className={cn('rounded-lg px-4 py-2 text-center text-sm font-semibold', color)}>
              {label}
            </div>
          )}

          {/* Review Status */}
          {review && (
            <div className="rounded-lg bg-muted/30 px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-medium">Review Status</span>
              <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-semibold', REVIEW_STATUS_COLORS[review.status])}>
                {review.status.replace('_', ' ')}
              </span>
            </div>
          )}

          {/* Goals */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Goals ({achievedGoals}/{totalGoals} achieved · {weightedProgress}% weighted progress)
            </h4>
            {!goals?.length
              ? <p className="text-sm text-muted-foreground">No goals set for this cycle.</p>
              : (
                <div className="space-y-2">
                  {goals.map((g) => (
                    <div key={g.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{g.title}</p>
                          {g.targetValue && <p className="text-xs text-blue-600">Target: {g.targetValue}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground">w: {g.weightage}</span>
                          <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', GOAL_COLORS[g.status])}>
                            {g.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={g.progress} className="flex-1 h-1.5" />
                        <span className="text-xs text-muted-foreground w-8 text-right">{g.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>

          {/* Peer Feedback */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Peer Feedback ({summary.peerFeedbackCount} received
              {avgPeerRating && ` · ⭐ ${avgPeerRating.toFixed(1)} avg`})
            </h4>
            {!feedbacks?.length
              ? <p className="text-sm text-muted-foreground">No peer feedback received.</p>
              : (
                <div className="space-y-2">
                  {feedbacks.map((f) => (
                    <div key={f.id} className="rounded-lg bg-muted/30 p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          From: {f.from ? `${f.from.firstName} ${f.from.lastName}` : 'Anonymous'}
                        </span>
                        {f.rating && <span className="text-yellow-500 text-xs">{'★'.repeat(Math.round(f.rating))}{'☆'.repeat(5 - Math.round(f.rating))}</span>}
                      </div>
                      {f.strengths && <p className="text-xs text-green-700"><span className="font-medium">Strengths:</span> {f.strengths}</p>}
                      {f.improvements && <p className="text-xs text-orange-700"><span className="font-medium">Improvements:</span> {f.improvements}</p>}
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// MY SCORECARD TAB (Employee view)
// ─────────────────────────────────────────────────────────────

function MyScorecardTab({ cycleId }: { cycleId: string | null }) {
  const { data: goals, isLoading: goalsLoading } = useGoals(cycleId);
  const { data: reviews, isLoading: reviewLoading } = useReviews(cycleId);
  const { data: feedbacks, isLoading: feedbackLoading } = usePeerFeedbacks(cycleId);

  const review = reviews?.[0] ?? null;

  const weightedProgress = useMemo(() => {
    if (!goals?.length) return 0;
    const totalW = goals.reduce((s, g) => s + g.weightage, 0);
    return totalW > 0
      ? Math.round(goals.reduce((s, g) => s + g.progress * g.weightage, 0) / totalW)
      : 0;
  }, [goals]);

  const ratedFeedbacks = feedbacks?.filter((f) => f.rating != null) ?? [];
  const avgPeerRating =
    ratedFeedbacks.length > 0
      ? Math.round((ratedFeedbacks.reduce((s, f) => s + (f.rating ?? 0), 0) / ratedFeedbacks.length) * 10) / 10
      : null;

  const overallScore = computeOverallScore(review, weightedProgress, avgPeerRating);
  const label = overallScore ? ratingLabel(overallScore) : null;
  const color = overallScore ? ratingColor(overallScore) : '';

  if (!cycleId)
    return <p className="text-muted-foreground text-sm py-8 text-center">Select a cycle to view your scorecard.</p>;

  if (goalsLoading || reviewLoading || feedbackLoading)
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-muted h-24 animate-pulse rounded-xl" />
        ))}
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Hero: Overall Score */}
      {overallScore && label ? (
        <div className="rounded-xl border bg-linear-to-br from-primary/5 to-primary/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Overall Performance Score</p>
              <p className="text-5xl font-bold text-primary">{overallScore.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground mt-0.5">out of 5.0</p>
            </div>
            <div className="text-right">
              <span className={cn('inline-flex rounded-full px-4 py-2 text-sm font-semibold', color)}>
                {label}
              </span>
              {review && (
                <p className="text-xs text-muted-foreground mt-2">
                  Review: <span className={cn('font-medium', REVIEW_STATUS_COLORS[review.status].split(' ')[1])}>
                    {review.status.replace('_', ' ')}
                  </span>
                </p>
              )}
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Performance</span>
              <span>{Math.round((overallScore / 5) * 100)}%</span>
            </div>
            <Progress value={(overallScore / 5) * 100} className="h-2" />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border p-6 text-center">
          <Trophy className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">No score yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            {!review
              ? 'Your manager hasn\'t initiated a review for you yet.'
              : review.status === 'PENDING'
              ? 'Submit your self-assessment to start the review process.'
              : 'Waiting for your manager to complete the review.'}
          </p>
        </div>
      )}

      {/* Rating breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center">
              <UserCheck className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-sm font-medium">Self Rating</p>
          </div>
          {review?.selfRating
            ? <StarDisplay value={review.selfRating} />
            : <p className="text-sm text-muted-foreground">Not submitted</p>}
          {review?.selfComments && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{review.selfComments}</p>
          )}
        </div>

        <div className="rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-7 w-7 rounded-full bg-green-100 flex items-center justify-center">
              <Award className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-sm font-medium">Manager Rating</p>
          </div>
          {review?.managerRating
            ? <StarDisplay value={review.managerRating} />
            : <p className="text-sm text-muted-foreground">Pending</p>}
          {review?.managerComments && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{review.managerComments}</p>
          )}
          {review?.reviewer && (
            <p className="text-xs text-muted-foreground mt-1">
              by {review.reviewer.firstName} {review.reviewer.lastName}
            </p>
          )}
        </div>

        <div className="rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-7 w-7 rounded-full bg-purple-100 flex items-center justify-center">
              <Users className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-sm font-medium">Peer Feedback</p>
          </div>
          {avgPeerRating
            ? <StarDisplay value={avgPeerRating} />
            : <p className="text-sm text-muted-foreground">None yet</p>}
          <p className="text-xs text-muted-foreground mt-1">{feedbacks?.length ?? 0} reviews received</p>
        </div>
      </div>

      {/* Goals Summary */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Target className="h-4 w-4" /> Goals Progress
          </h3>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{goals?.filter((g) => g.status === 'ACHIEVED').length ?? 0} achieved</span>
            <span>·</span>
            <span>{weightedProgress}% weighted avg</span>
          </div>
        </div>
        {!goals?.length ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-10">
              <Target className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No goals set for this cycle.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {goals.map((g) => (
              <div key={g.id} className="rounded-lg border p-3.5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{g.title}</p>
                    {g.targetValue && <p className="text-xs text-blue-600 mt-0.5">Target: {g.targetValue}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">w:{g.weightage}</span>
                    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', GOAL_COLORS[g.status])}>
                      {g.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={g.progress} className="flex-1 h-2" />
                  <span className="text-xs font-medium text-muted-foreground w-8 text-right">{g.progress}%</span>
                </div>
                {g.dueDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Due: {new Date(g.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Peer Feedback Received */}
      {(feedbacks?.length ?? 0) > 0 && (
        <div>
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Users className="h-4 w-4" /> Peer Feedback Received
          </h3>
          <div className="space-y-3">
            {feedbacks!.map((f) => (
              <Card key={f.id}>
                <CardContent className="pt-4 pb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={f.from?.avatarUrl ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {f.from ? initials(f.from.firstName, f.from.lastName) : '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {f.from ? `${f.from.firstName} ${f.from.lastName}` : 'Anonymous'}
                      </span>
                    </div>
                    {f.rating && <StarDisplay value={f.rating} />}
                  </div>
                  {f.strengths && (
                    <p className="text-sm text-green-700 bg-green-50 rounded px-2 py-1">
                      <span className="font-medium">Strengths: </span>{f.strengths}
                    </p>
                  )}
                  {f.improvements && (
                    <p className="text-sm text-orange-700 bg-orange-50 rounded px-2 py-1">
                      <span className="font-medium">Areas to improve: </span>{f.improvements}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TEAM OVERVIEW TAB (HR / Manager)
// ─────────────────────────────────────────────────────────────

function TeamOverviewTab({ cycleId }: { cycleId: string | null }) {
  const { data: overview, isLoading } = useTeamOverview(cycleId);
  const { mutateAsync: initReviews, isPending: initializing } = useInitializeReviews();
  const [detailEmployee, setDetailEmployee] = useState<EmployeePerfSummary | null>(null);
  const [search, setSearch] = useState('');

  if (!cycleId)
    return <p className="text-muted-foreground text-sm py-8 text-center">Select a cycle to view team performance.</p>;

  const filtered = (overview ?? []).filter((s) => {
    const q = search.toLowerCase();
    return (
      s.employee.firstName.toLowerCase().includes(q) ||
      s.employee.lastName.toLowerCase().includes(q) ||
      s.employee.employeeCode.toLowerCase().includes(q) ||
      (s.employee.department?.name ?? '').toLowerCase().includes(q)
    );
  });

  const reviewedCount = (overview ?? []).filter((s) => s.review?.status === 'COMPLETED').length;
  const pendingCount = (overview ?? []).filter((s) => !s.review).length;
  const inProgressCount = (overview ?? []).filter(
    (s) => s.review && s.review.status !== 'COMPLETED',
  ).length;

  async function handleInitialize() {
    if (!cycleId) return;
    try {
      const result = await initReviews(cycleId);
      toast.success(`Initialized ${result.created} reviews (${result.skipped} already existed)`);
    } catch {
      toast.error('Failed to initialize reviews');
    }
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{reviewedCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Reviews Completed</p>
        </div>
        <div className="rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">In Progress</p>
        </div>
        <div className="rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-gray-500">{pendingCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Not Initiated</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
        <Input
          placeholder="Search by name, code, department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-72"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleInitialize}
          disabled={initializing}
        >
          {initializing
            ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            : <RefreshCw className="mr-2 h-4 w-4" />}
          Initialize All Reviews
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-muted h-14 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : !filtered.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Users className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">No employees found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Employee</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Department</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Goals</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Self</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Manager</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Peers</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((s) => {
                  const overallScore = computeOverallScore(
                    s.review as PerformanceReview | null,
                    s.weightedProgress,
                    s.avgPeerRating,
                  );
                  return (
                    <tr key={s.employee.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarImage src={s.employee.avatarUrl ?? undefined} />
                            <AvatarFallback className="text-xs">
                              {initials(s.employee.firstName, s.employee.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {s.employee.firstName} {s.employee.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">{s.employee.employeeCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {s.employee.department?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs font-medium">
                            {s.achievedGoals}/{s.totalGoals}
                          </span>
                          {s.totalGoals > 0 && (
                            <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${s.weightedProgress}%` }}
                              />
                            </div>
                          )}
                          {s.totalGoals > 0 && (
                            <span className="text-xs text-muted-foreground">{s.weightedProgress}%</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s.review?.selfRating
                          ? <span className="font-medium">{s.review.selfRating.toFixed(1)}<span className="text-muted-foreground text-xs">/5</span></span>
                          : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s.review?.managerRating
                          ? (
                            <span className={cn(
                              'font-semibold',
                              s.review.managerRating >= 4 ? 'text-green-600' :
                              s.review.managerRating >= 3 ? 'text-blue-600' : 'text-orange-600',
                            )}>
                              {s.review.managerRating.toFixed(1)}<span className="text-muted-foreground text-xs font-normal">/5</span>
                            </span>
                          )
                          : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s.review
                          ? (
                            <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', REVIEW_STATUS_COLORS[s.review.status])}>
                              {s.review.status === 'SELF_SUBMITTED' ? 'Self Done' :
                               s.review.status === 'COMPLETED' ? 'Completed' :
                               s.review.status.replace('_', ' ')}
                            </span>
                          )
                          : <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500">Not Started</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s.peerFeedbackCount > 0 ? (
                          <div className="flex flex-col items-center">
                            <span className="text-xs font-medium">{s.peerFeedbackCount}</span>
                            {s.avgPeerRating && (
                              <span className="text-xs text-yellow-600">⭐{s.avgPeerRating.toFixed(1)}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => setDetailEmployee(s)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <EmployeeDetailModal
        open={!!detailEmployee}
        onClose={() => setDetailEmployee(null)}
        summary={detailEmployee}
        cycleId={cycleId}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// GOALS TAB
// ─────────────────────────────────────────────────────────────

function GoalsTab({ cycleId, isManagerView }: { cycleId: string | null; isManagerView: boolean }) {
  const [addOpen, setAddOpen] = useState(false);
  const [filterEmpId, setFilterEmpId] = useState('');
  const { data: goals, isLoading } = useGoals(cycleId, filterEmpId || undefined);
  const { mutateAsync: updateGoal } = useUpdateGoal();
  const { mutateAsync: deleteGoal } = useDeleteGoal();
  const { data: employeesData } = useEmployees({ limit: 200 });

  if (!cycleId)
    return <p className="text-muted-foreground text-sm py-8 text-center">Select a cycle to view goals.</p>;

  const weightedAvg = useMemo(() => {
    if (!goals?.length) return 0;
    const totalW = goals.reduce((s, g) => s + g.weightage, 0);
    return totalW > 0
      ? Math.round(goals.reduce((s, g) => s + g.progress * g.weightage, 0) / totalW)
      : 0;
  }, [goals]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {isManagerView && (
            <Select value={filterEmpId} onValueChange={setFilterEmpId}>
              <SelectTrigger className="w-52 h-8 text-sm">
                <SelectValue placeholder="All employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All employees</SelectItem>
                {(employeesData?.employees ?? []).map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.firstName} {e.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {goals && goals.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {goals.filter((g) => g.status === 'ACHIEVED').length}/{goals.length} achieved · {weightedAvg}% weighted progress
            </span>
          )}
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {isManagerView ? 'Add / Assign Goal' : 'Add Goal'}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-muted h-20 animate-pulse rounded-lg" />)}
        </div>
      ) : !goals?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Target className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">No goals set yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => (
            <Card key={goal.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-base">{goal.title}</CardTitle>
                      <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', GOAL_COLORS[goal.status])}>
                        {goal.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-muted-foreground">weight: {goal.weightage}</span>
                    </div>
                    {goal.description && <p className="text-muted-foreground text-sm mt-1">{goal.description}</p>}
                    {goal.targetValue && <p className="text-xs text-blue-600 mt-1">🎯 Target: {goal.targetValue}</p>}
                    {goal.employee && isManagerView && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Employee: {goal.employee.firstName} {goal.employee.lastName}
                      </p>
                    )}
                    {goal.dueDate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Due: {new Date(goal.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Select
                      value={goal.status}
                      onValueChange={(v) => {
                        void updateGoal({ id: goal.id, cycleId: goal.cycleId, status: v as GoalStatus });
                      }}
                    >
                      <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="ACHIEVED">Achieved</SelectItem>
                        <SelectItem value="MISSED">Missed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 h-7 px-2 text-xs"
                      onClick={() => { void deleteGoal({ id: goal.id, cycleId: goal.cycleId }); }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex items-center gap-3">
                  <Progress value={goal.progress} className="flex-1 h-2" />
                  <span className="text-xs text-muted-foreground w-10 text-right">{goal.progress}%</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={goal.progress}
                    className="w-24"
                    onChange={(e) => {
                      void updateGoal({ id: goal.id, cycleId: goal.cycleId, progress: Number(e.target.value) });
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {addOpen && <AddGoalDialog cycleId={cycleId} open={addOpen} onClose={() => setAddOpen(false)} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// REVIEWS TAB
// ─────────────────────────────────────────────────────────────

function ReviewsTab({ cycleId }: { cycleId: string | null }) {
  const { data: reviews, isLoading } = useReviews(cycleId);
  const { mutateAsync: submitSelf, isPending: selfPending } = useSubmitSelfReview();
  const { mutateAsync: submitManager, isPending: managerPending } = useSubmitManagerReview();
  const role = useAuthStore((s) => s.user?.role);
  const isManagerRole = MANAGER_ROLES.includes(role ?? '');
  const [selfRating, setSelfRating] = useState(0);
  const [selfComments, setSelfComments] = useState('');
  const [managerRatings, setManagerRatings] = useState<Record<string, number>>({});
  const [managerComments, setManagerComments] = useState<Record<string, string>>({});

  if (!cycleId)
    return <p className="text-muted-foreground text-sm py-8 text-center">Select a cycle to view reviews.</p>;

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => <div key={i} className="bg-muted h-40 animate-pulse rounded-lg" />)}
        </div>
      ) : !reviews?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Star className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">No reviews found for this cycle.</p>
            {!isManagerRole && (
              <p className="text-xs text-muted-foreground">Ask HR to initialize reviews for this cycle.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        reviews.map((review) => (
          <Card key={review.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                {review.employee && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={review.employee.avatarUrl ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {initials(review.employee.firstName, review.employee.lastName)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-base">
                      {review.employee
                        ? `${review.employee.firstName} ${review.employee.lastName}`
                        : 'Review'}
                    </CardTitle>
                    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', REVIEW_STATUS_COLORS[review.status])}>
                      {review.status.replace('_', ' ')}
                    </span>
                  </div>
                  {review.employee?.designation && (
                    <p className="text-xs text-muted-foreground">
                      {review.employee.designation}
                      {review.employee.department && ` · ${review.employee.department.name}`}
                    </p>
                  )}
                  {review.reviewer && (
                    <p className="text-xs text-muted-foreground">
                      Reviewer: {review.reviewer.firstName} {review.reviewer.lastName}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Self assessment display */}
              {review.selfRating != null && (
                <div className="rounded-lg bg-blue-50 p-3 space-y-1">
                  <p className="text-xs font-semibold text-blue-700">Self Assessment</p>
                  <StarDisplay value={review.selfRating} />
                  {review.selfComments && <p className="text-sm text-blue-800 mt-1">{review.selfComments}</p>}
                </div>
              )}

              {/* Manager assessment display */}
              {review.managerRating != null && (
                <div className="rounded-lg bg-green-50 p-3 space-y-1">
                  <p className="text-xs font-semibold text-green-700">Manager Assessment</p>
                  <StarDisplay value={review.managerRating} />
                  {review.managerComments && <p className="text-sm text-green-800 mt-1">{review.managerComments}</p>}
                  {review.finalRating && review.finalRating !== review.managerRating && (
                    <p className="text-xs text-muted-foreground mt-1">Final Rating: {review.finalRating.toFixed(1)}/5</p>
                  )}
                </div>
              )}

              {/* Employee submitting self review */}
              {review.status === 'PENDING' && !isManagerRole && (
                <div className="space-y-3 border rounded-lg p-4">
                  <p className="text-sm font-medium">Submit Your Self Assessment</p>
                  <div className="space-y-1">
                    <Label className="text-xs">Rating</Label>
                    <StarPicker value={selfRating} onChange={setSelfRating} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Comments</Label>
                    <Textarea
                      placeholder="Describe your achievements, challenges, and contributions this cycle..."
                      rows={3}
                      value={selfComments}
                      onChange={(e) => setSelfComments(e.target.value)}
                    />
                  </div>
                  <Button
                    size="sm"
                    disabled={selfRating === 0 || selfPending}
                    onClick={async () => {
                      try {
                        await submitSelf({
                          reviewId: review.id,
                          cycleId: cycleId!,
                          selfRating,
                          selfComments: selfComments || undefined,
                        });
                        toast.success('Self assessment submitted');
                        setSelfRating(0);
                        setSelfComments('');
                      } catch {
                        toast.error('Failed to submit');
                      }
                    }}
                  >
                    {selfPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Self Review
                  </Button>
                </div>
              )}

              {/* Manager submitting review */}
              {isManagerRole && review.status === 'SELF_SUBMITTED' && (
                <div className="space-y-3 border rounded-lg p-4">
                  <p className="text-sm font-medium">Submit Manager Review</p>
                  <div className="space-y-1">
                    <Label className="text-xs">Manager Rating</Label>
                    <StarPicker
                      value={managerRatings[review.id] ?? 0}
                      onChange={(v) => setManagerRatings((prev) => ({ ...prev, [review.id]: v }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Comments</Label>
                    <Textarea
                      placeholder="Provide feedback on this employee's performance..."
                      rows={3}
                      value={managerComments[review.id] ?? ''}
                      onChange={(e) =>
                        setManagerComments((prev) => ({ ...prev, [review.id]: e.target.value }))
                      }
                    />
                  </div>
                  <Button
                    size="sm"
                    disabled={(managerRatings[review.id] ?? 0) === 0 || managerPending}
                    onClick={async () => {
                      const rating = managerRatings[review.id] ?? 0;
                      try {
                        await submitManager({
                          reviewId: review.id,
                          cycleId: cycleId!,
                          managerRating: rating,
                          managerComments: managerComments[review.id] || undefined,
                        });
                        toast.success('Manager review submitted');
                      } catch {
                        toast.error('Failed to submit review');
                      }
                    }}
                  >
                    {managerPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Manager Review
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PEER FEEDBACK TAB
// ─────────────────────────────────────────────────────────────

function PeerFeedbackTab({ cycleId }: { cycleId: string | null }) {
  const { data: feedbacks, isLoading } = usePeerFeedbacks(cycleId);
  const { mutateAsync: submit, isPending } = useSubmitPeerFeedback();
  const { data: employeesData } = useEmployees({ limit: 200 });
  const [toId, setToId] = useState('');
  const [rating, setRating] = useState(0);
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');

  if (!cycleId)
    return <p className="text-muted-foreground text-sm py-8 text-center">Select a cycle to give feedback.</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Zap className="h-4 w-4 text-yellow-500" />Give Peer Feedback</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Select Employee</Label>
            <Select value={toId} onValueChange={setToId}>
              <SelectTrigger><SelectValue placeholder="Choose a colleague..." /></SelectTrigger>
              <SelectContent>
                {(employeesData?.employees ?? []).map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.firstName} {e.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Overall Rating</Label>
            <StarPicker value={rating} onChange={setRating} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Strengths</Label>
              <Textarea
                placeholder="What does this person do well?"
                rows={3}
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Areas for Improvement</Label>
              <Textarea
                placeholder="Where can they grow further?"
                rows={3}
                value={improvements}
                onChange={(e) => setImprovements(e.target.value)}
              />
            </div>
          </div>
          <Button
            size="sm"
            disabled={!toId || isPending}
            onClick={async () => {
              try {
                await submit({
                  cycleId: cycleId!,
                  toId,
                  ...(rating ? { rating } : {}),
                  ...(strengths ? { strengths } : {}),
                  ...(improvements ? { improvements } : {}),
                });
                toast.success('Feedback submitted');
                setToId(''); setRating(0); setStrengths(''); setImprovements('');
              } catch {
                toast.error('Failed to submit feedback');
              }
            }}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Feedback
          </Button>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-sm font-semibold mb-3">Feedback Received</h3>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => <div key={i} className="bg-muted h-16 animate-pulse rounded-lg" />)}
          </div>
        ) : !feedbacks?.length ? (
          <p className="text-sm text-muted-foreground">No feedback received yet.</p>
        ) : (
          <div className="space-y-3">
            {feedbacks.map((f) => (
              <Card key={f.id}>
                <CardContent className="pt-4 pb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={f.from?.avatarUrl ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {f.from ? initials(f.from.firstName, f.from.lastName) : '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {f.from ? `${f.from.firstName} ${f.from.lastName}` : 'Anonymous'}
                      </span>
                    </div>
                    {f.rating && <StarDisplay value={f.rating} />}
                  </div>
                  {f.strengths && (
                    <p className="text-sm text-green-700 bg-green-50 rounded px-2 py-1">
                      <span className="font-medium">Strengths: </span>{f.strengths}
                    </p>
                  )}
                  {f.improvements && (
                    <p className="text-sm text-orange-700 bg-orange-50 rounded px-2 py-1">
                      <span className="font-medium">Improvements: </span>{f.improvements}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CYCLES TAB (HR Only)
// ─────────────────────────────────────────────────────────────

function CyclesTab({
  onCycleSelect,
}: {
  onCycleSelect: (id: string) => void;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const { data: cycles, isLoading } = useCycles();
  const { mutateAsync: updateCycle } = useUpdateCycle();
  const { mutateAsync: initReviews, isPending: initializing } = useInitializeReviews();

  const CYCLE_STATUS_COLORS: Record<string, string> = {
    DRAFT:  'bg-gray-100 text-gray-600',
    ACTIVE: 'bg-green-100 text-green-700',
    CLOSED: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />New Cycle
        </Button>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-muted h-16 animate-pulse rounded-lg" />)}
        </div>
      ) : !cycles?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <BarChart3 className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">No performance cycles yet. Create your first one.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {cycles.map((cycle) => (
            <Card key={cycle.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-base">{cycle.name}</CardTitle>
                      <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', CYCLE_STATUS_COLORS[cycle.status])}>
                        {cycle.status}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {cycle.frequency} · {new Date(cycle.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} – {new Date(cycle.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    {cycle._count && (
                      <p className="text-muted-foreground text-xs">
                        {cycle._count.goals} goals · {cycle._count.reviews} reviews
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      disabled={initializing}
                      onClick={async () => {
                        try {
                          const r = await initReviews(cycle.id);
                          toast.success(`Initialized ${r.created} reviews (${r.skipped} skipped)`);
                        } catch {
                          toast.error('Failed to initialize');
                        }
                      }}
                    >
                      {initializing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                      Init Reviews
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => onCycleSelect(cycle.id)}
                    >
                      <Eye className="h-3 w-3 mr-1" />View
                    </Button>
                    <Select
                      value={cycle.status}
                      onValueChange={(v) => { void updateCycle({ id: cycle.id, status: v as any }); }}
                    >
                      <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
      <CreateCycleDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────

export default function PerformancePage() {
  const role = useAuthStore((s) => s.user?.role);
  const isHR = HR_ROLES.includes(role ?? '');
  const isManagerRole = MANAGER_ROLES.includes(role ?? '');
  const isEmployee = !isManagerRole;

  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(isEmployee ? 'scorecard' : 'overview');
  const { data: cycles } = useCycles();

  // Auto-select active cycle on load
  if (cycles?.length && !selectedCycleId) {
    const active = cycles.find((c) => c.status === 'ACTIVE') ?? cycles[0];
    if (active) setSelectedCycleId(active.id);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Performance</h1>
          <p className="text-muted-foreground text-sm">
            {isEmployee
              ? 'Track your goals, reviews, and feedback'
              : 'Manage team performance, goals, and reviews'}
          </p>
        </div>
        {cycles && cycles.length > 0 && (
          <Select value={selectedCycleId ?? ''} onValueChange={setSelectedCycleId}>
            <SelectTrigger className="w-60">
              <SelectValue placeholder="Select cycle" />
            </SelectTrigger>
            <SelectContent>
              {cycles.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                  <span className={cn('ml-2 text-xs', c.status === 'ACTIVE' ? 'text-green-600' : 'text-muted-foreground')}>
                    ({c.status})
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Tabs — role-aware */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          {isEmployee ? (
            <>
              <TabsTrigger value="scorecard" className="flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5" />My Scorecard
              </TabsTrigger>
              <TabsTrigger value="goals">My Goals</TabsTrigger>
              <TabsTrigger value="reviews">My Review</TabsTrigger>
              <TabsTrigger value="feedback">Peer Feedback</TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger value="overview" className="flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" />Team Overview
              </TabsTrigger>
              <TabsTrigger value="goals" className="flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" />Goals
              </TabsTrigger>
              <TabsTrigger value="reviews" className="flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5" />Reviews
              </TabsTrigger>
              <TabsTrigger value="feedback" className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />Peer Feedback
              </TabsTrigger>
              {isHR && (
                <TabsTrigger value="cycles" className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" />Cycles
                </TabsTrigger>
              )}
            </>
          )}
        </TabsList>

        <div className="mt-4">
          {isEmployee ? (
            <>
              <TabsContent value="scorecard">
                <MyScorecardTab cycleId={selectedCycleId} />
              </TabsContent>
              <TabsContent value="goals">
                <GoalsTab cycleId={selectedCycleId} isManagerView={false} />
              </TabsContent>
              <TabsContent value="reviews">
                <ReviewsTab cycleId={selectedCycleId} />
              </TabsContent>
              <TabsContent value="feedback">
                <PeerFeedbackTab cycleId={selectedCycleId} />
              </TabsContent>
            </>
          ) : (
            <>
              <TabsContent value="overview">
                <TeamOverviewTab cycleId={selectedCycleId} />
              </TabsContent>
              <TabsContent value="goals">
                <GoalsTab cycleId={selectedCycleId} isManagerView={true} />
              </TabsContent>
              <TabsContent value="reviews">
                <ReviewsTab cycleId={selectedCycleId} />
              </TabsContent>
              <TabsContent value="feedback">
                <PeerFeedbackTab cycleId={selectedCycleId} />
              </TabsContent>
              {isHR && (
                <TabsContent value="cycles">
                  <CyclesTab
                    onCycleSelect={(id) => {
                      setSelectedCycleId(id);
                      setActiveTab('overview');
                    }}
                  />
                </TabsContent>
              )}
            </>
          )}
        </div>
      </Tabs>
    </div>
  );
}
