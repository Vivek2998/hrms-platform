import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Target, Plus, Star, Users, BarChart3, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  useCycles, useCreateCycle, useUpdateCycle,
  useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal,
  useReviews, useCreateReview,
  useSubmitSelfReview, useSubmitManagerReview,
  usePeerFeedbacks, useSubmitPeerFeedback,
  type CycleFrequency, type GoalStatus, type PerformanceCycle,
} from '@/hooks/usePerformance';
import { useEmployees } from '@/hooks/useEmployees';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'];
const MANAGER_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'];

const GOAL_COLORS: Record<GoalStatus, string> = {
  NOT_STARTED: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  ACHIEVED: 'bg-green-100 text-green-700',
  MISSED: 'bg-red-100 text-red-700',
};

const CYCLE_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  ACTIVE: 'bg-green-100 text-green-700',
  CLOSED: 'bg-red-100 text-red-700',
};

function StarRating({ value, onChange, max = 5 }: { value: number; onChange: (v: number) => void; max?: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => { onChange(i + 1); }}
          className={cn('h-8 w-8 rounded text-lg transition-colors', i < value ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400')}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function CreateCycleDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { register, handleSubmit, reset, setValue, watch } = useForm({ defaultValues: { name: '', frequency: 'ANNUAL' as CycleFrequency, startDate: '', endDate: '' } });
  const { mutateAsync, isPending } = useCreateCycle();

  async function onSubmit(data: { name: string; frequency: CycleFrequency; startDate: string; endDate: string }) {
    try {
      await mutateAsync(data);
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
            <Select value={watch('frequency')} onValueChange={(v) => { setValue('frequency', v as CycleFrequency); }}>
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
            <Button type="submit" disabled={isPending}>{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddGoalDialog({ cycleId, open, onClose }: { cycleId: string; open: boolean; onClose: () => void }) {
  const { register, handleSubmit, reset } = useForm({ defaultValues: { title: '', description: '', targetValue: '', dueDate: '' } });
  const { mutateAsync, isPending } = useCreateGoal();

  async function onSubmit(data: { title: string; description: string; targetValue: string; dueDate: string }) {
    try {
      await mutateAsync({ cycleId, title: data.title, description: data.description || undefined, targetValue: data.targetValue || undefined, dueDate: data.dueDate || undefined });
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
        <DialogHeader><DialogTitle>Add Goal</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1"><Label>Title</Label><Input {...register('title', { required: true })} placeholder="Goal title" /></div>
          <div className="space-y-1"><Label>Description</Label><Textarea {...register('description')} placeholder="Optional description" rows={2} /></div>
          <div className="space-y-1"><Label>Target / KPI</Label><Input {...register('targetValue')} placeholder="e.g. 95% customer satisfaction" /></div>
          <div className="space-y-1"><Label>Due Date</Label><Input type="date" {...register('dueDate')} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function GoalsTab({ cycleId }: { cycleId: string | null }) {
  const [addOpen, setAddOpen] = useState(false);
  const { data: goals, isLoading } = useGoals(cycleId);
  const { mutateAsync: updateGoal } = useUpdateGoal();
  const { mutateAsync: deleteGoal } = useDeleteGoal();

  if (!cycleId) return <p className="text-muted-foreground text-sm py-8 text-center">Select a cycle to view goals.</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setAddOpen(true); }}><Plus className="mr-2 h-4 w-4" />Add Goal</Button>
      </div>
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-muted h-20 animate-pulse rounded-lg" />)}</div>
      ) : !goals?.length ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-12">
          <Target className="text-muted-foreground h-10 w-10" />
          <p className="text-muted-foreground text-sm">No goals set yet. Add your first goal.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => (
            <Card key={goal.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-base">{goal.title}</CardTitle>
                      <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', GOAL_COLORS[goal.status])}>
                        {goal.status.replace('_', ' ')}
                      </span>
                    </div>
                    {goal.description && <p className="text-muted-foreground text-sm mt-1">{goal.description}</p>}
                    {goal.targetValue && <p className="text-xs text-blue-600 mt-1">Target: {goal.targetValue}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Select
                      value={goal.status}
                      onValueChange={(v) => { void updateGoal({ id: goal.id, cycleId: goal.cycleId, status: v as GoalStatus }); }}
                    >
                      <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="ACHIEVED">Achieved</SelectItem>
                        <SelectItem value="MISSED">Missed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="ghost" className="text-red-500 h-7 px-2 text-xs" onClick={() => { void deleteGoal({ id: goal.id, cycleId: goal.cycleId }); }}>Remove</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex items-center gap-3">
                  <Progress value={goal.progress} className="flex-1 h-2" />
                  <span className="text-xs text-muted-foreground w-10 text-right">{goal.progress}%</span>
                  <input
                    type="range" min={0} max={100} value={goal.progress}
                    className="w-24"
                    onChange={(e) => { void updateGoal({ id: goal.id, cycleId: goal.cycleId, progress: Number(e.target.value) }); }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {addOpen && <AddGoalDialog cycleId={cycleId} open={addOpen} onClose={() => { setAddOpen(false); }} />}
    </div>
  );
}

function ReviewTab({ cycleId }: { cycleId: string | null }) {
  const { data: reviews, isLoading } = useReviews(cycleId);
  const { mutateAsync: submitSelf, isPending: selfPending } = useSubmitSelfReview();
  const { mutateAsync: submitManager, isPending: managerPending } = useSubmitManagerReview();
  const [selfRating, setSelfRating] = useState(0);
  const [selfComments, setSelfComments] = useState('');
  const [managerRating, setManagerRating] = useState(0);
  const [managerComments, setManagerComments] = useState('');
  const role = useAuthStore((s) => s.user?.role);
  const isManager = MANAGER_ROLES.includes(role ?? '');

  if (!cycleId) return <p className="text-muted-foreground text-sm py-8 text-center">Select a cycle to view reviews.</p>;

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="bg-muted h-40 animate-pulse rounded-lg" />)}</div>
      ) : !reviews?.length ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-12">
          <Star className="text-muted-foreground h-10 w-10" />
          <p className="text-muted-foreground text-sm">No reviews have been initiated for this cycle yet.</p>
        </CardContent></Card>
      ) : (
        reviews.map((review) => (
          <Card key={review.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {review.employee ? `${review.employee.firstName} ${review.employee.lastName}` : 'Review'}
                </CardTitle>
                <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                  review.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                  review.status === 'SELF_SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-600'
                )}>
                  {review.status.replace('_', ' ')}
                </span>
              </div>
              {review.reviewer && <p className="text-muted-foreground text-sm">Reviewer: {review.reviewer.firstName} {review.reviewer.lastName}</p>}
            </CardHeader>
            <CardContent className="space-y-4">
              {review.selfRating != null && (
                <div className="rounded-lg bg-blue-50 p-3 space-y-1">
                  <p className="text-sm font-medium">Self Assessment</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Rating:</span>
                    <span className="font-medium">{review.selfRating}/5</span>
                  </div>
                  {review.selfComments && <p className="text-sm">{review.selfComments}</p>}
                </div>
              )}
              {review.status === 'PENDING' && (
                <div className="space-y-3 border rounded-lg p-3">
                  <p className="text-sm font-medium">Submit Self Assessment</p>
                  <StarRating value={selfRating} onChange={setSelfRating} />
                  <Textarea placeholder="Comments..." rows={3} value={selfComments} onChange={(e) => { setSelfComments(e.target.value); }} />
                  <Button size="sm" disabled={selfRating === 0 || selfPending} onClick={async () => {
                    try {
                      await submitSelf({ reviewId: review.id, cycleId: cycleId!, selfRating, selfComments: selfComments || undefined });
                      toast.success('Self assessment submitted');
                    } catch { toast.error('Failed to submit'); }
                  }}>
                    {selfPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit Self Review
                  </Button>
                </div>
              )}
              {review.managerRating != null && (
                <div className="rounded-lg bg-green-50 p-3 space-y-1">
                  <p className="text-sm font-medium">Manager Assessment</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Rating:</span>
                    <span className="font-medium">{review.managerRating}/5</span>
                  </div>
                  {review.managerComments && <p className="text-sm">{review.managerComments}</p>}
                </div>
              )}
              {isManager && review.status === 'SELF_SUBMITTED' && (
                <div className="space-y-3 border rounded-lg p-3">
                  <p className="text-sm font-medium">Submit Manager Review</p>
                  <StarRating value={managerRating} onChange={setManagerRating} />
                  <Textarea placeholder="Manager comments..." rows={3} value={managerComments} onChange={(e) => { setManagerComments(e.target.value); }} />
                  <Button size="sm" disabled={managerRating === 0 || managerPending} onClick={async () => {
                    try {
                      await submitManager({ reviewId: review.id, cycleId: cycleId!, managerRating, managerComments: managerComments || undefined });
                      toast.success('Manager review submitted');
                    } catch { toast.error('Failed to submit'); }
                  }}>
                    {managerPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit Manager Review
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

function PeerFeedbackTab({ cycleId }: { cycleId: string | null }) {
  const { data: feedbacks, isLoading } = usePeerFeedbacks(cycleId);
  const { mutateAsync: submit, isPending } = useSubmitPeerFeedback();
  const { data: employeesData } = useEmployees({ limit: 100 });
  const [toId, setToId] = useState('');
  const [rating, setRating] = useState(0);
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');

  if (!cycleId) return <p className="text-muted-foreground text-sm py-8 text-center">Select a cycle to view peer feedback.</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Give Peer Feedback</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Select Employee</Label>
            <Select value={toId} onValueChange={setToId}>
              <SelectTrigger><SelectValue placeholder="Choose an employee..." /></SelectTrigger>
              <SelectContent>
                {(employeesData?.employees ?? []).map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label>Overall Rating</Label><StarRating value={rating} onChange={setRating} /></div>
          <div className="space-y-1"><Label>Strengths</Label><Textarea placeholder="What does this person do well?" rows={2} value={strengths} onChange={(e) => { setStrengths(e.target.value); }} /></div>
          <div className="space-y-1"><Label>Areas for Improvement</Label><Textarea placeholder="Where can they improve?" rows={2} value={improvements} onChange={(e) => { setImprovements(e.target.value); }} /></div>
          <Button size="sm" disabled={!toId || isPending} onClick={async () => {
            try {
              await submit({ cycleId: cycleId!, toId, rating: rating || undefined, strengths: strengths || undefined, improvements: improvements || undefined });
              toast.success('Feedback submitted');
              setToId(''); setRating(0); setStrengths(''); setImprovements('');
            } catch { toast.error('Failed to submit feedback'); }
          }}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit Feedback
          </Button>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-sm font-medium mb-3">Feedback Received</h3>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="bg-muted h-16 animate-pulse rounded-lg" />)}</div>
        ) : !feedbacks?.length ? (
          <p className="text-muted-foreground text-sm">No feedback received yet.</p>
        ) : (
          <div className="space-y-3">
            {feedbacks.map((f) => (
              <Card key={f.id}>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{f.from ? `${f.from.firstName} ${f.from.lastName}` : 'Anonymous'}</span>
                    {f.rating && <span className="text-yellow-500 text-sm">{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</span>}
                  </div>
                  {f.strengths && <p className="text-sm text-green-700"><span className="font-medium">Strengths:</span> {f.strengths}</p>}
                  {f.improvements && <p className="text-sm text-orange-700"><span className="font-medium">Improvements:</span> {f.improvements}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CyclesTab() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data: cycles, isLoading } = useCycles();
  const { mutateAsync: updateCycle } = useUpdateCycle();

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setCreateOpen(true); }}><Plus className="mr-2 h-4 w-4" />New Cycle</Button>
      </div>
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-muted h-16 animate-pulse rounded-lg" />)}</div>
      ) : !cycles?.length ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-12">
          <BarChart3 className="text-muted-foreground h-10 w-10" />
          <p className="text-muted-foreground text-sm">No performance cycles created yet.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {cycles.map((cycle) => (
            <Card key={cycle.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{cycle.name}</CardTitle>
                      <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', CYCLE_STATUS_COLORS[cycle.status])}>
                        {cycle.status}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs">{cycle.frequency} · {new Date(cycle.startDate).toLocaleDateString()} – {new Date(cycle.endDate).toLocaleDateString()}</p>
                    {cycle._count && <p className="text-muted-foreground text-xs">{cycle._count.goals} goals · {cycle._count.reviews} reviews</p>}
                  </div>
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
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
      <CreateCycleDialog open={createOpen} onClose={() => { setCreateOpen(false); }} />
    </div>
  );
}

export default function PerformancePage() {
  const role = useAuthStore((s) => s.user?.role);
  const isHR = HR_ROLES.includes(role ?? '');
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const { data: cycles } = useCycles();

  useEffect(() => {
    if (cycles?.length && !selectedCycleId) {
      const active = cycles.find((c) => c.status === 'ACTIVE') ?? cycles[0];
      if (active) setSelectedCycleId(active.id);
    }
  }, [cycles, selectedCycleId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Performance</h1>
          <p className="text-muted-foreground">Goals, reviews, and peer feedback</p>
        </div>
        {cycles && cycles.length > 0 && (
          <Select value={selectedCycleId ?? ''} onValueChange={setSelectedCycleId}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Select cycle" /></SelectTrigger>
            <SelectContent>
              {cycles.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <Tabs defaultValue="goals">
        <TabsList>
          <TabsTrigger value="goals">My Goals</TabsTrigger>
          <TabsTrigger value="review">Reviews</TabsTrigger>
          <TabsTrigger value="feedback">Peer Feedback</TabsTrigger>
          {isHR && <TabsTrigger value="cycles">Cycles</TabsTrigger>}
        </TabsList>
        <TabsContent value="goals" className="mt-4"><GoalsTab cycleId={selectedCycleId} /></TabsContent>
        <TabsContent value="review" className="mt-4"><ReviewTab cycleId={selectedCycleId} /></TabsContent>
        <TabsContent value="feedback" className="mt-4"><PeerFeedbackTab cycleId={selectedCycleId} /></TabsContent>
        {isHR && <TabsContent value="cycles" className="mt-4"><CyclesTab /></TabsContent>}
      </Tabs>
    </div>
  );
}
