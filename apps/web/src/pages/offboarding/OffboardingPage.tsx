import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
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
import { Loader2, UserMinus, Plus, Trash2, CheckCircle2, Circle, SkipForward } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  useOffboardingTemplates, useCreateOffboardingTemplate, useDeleteOffboardingTemplate,
  useOffboardingAssignments, useOffboardingAssignment, useCreateOffboardingAssignment,
  useUpdateOffboardingTask, useExitInterview, useSubmitExitInterview,
  type OffboardingTaskStatus, type AssignedRole,
} from '@/hooks/useOffboarding';
import { useEmployees } from '@/hooks/useEmployees';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'];

const ROLE_COLORS: Record<AssignedRole, string> = {
  HR: 'bg-purple-100 text-purple-700',
  IT: 'bg-blue-100 text-blue-700',
  FINANCE: 'bg-green-100 text-green-700',
  MANAGER: 'bg-orange-100 text-orange-700',
  EMPLOYEE: 'bg-gray-100 text-gray-600',
};

function CreateTemplateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { register, handleSubmit, control, reset, setValue, watch } = useForm({
    defaultValues: {
      name: '',
      description: '',
      tasks: [{ title: '', description: '', assignedRole: 'HR' as AssignedRole, dueBeforeDays: 0, isRequired: true, displayOrder: 0 }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'tasks' });
  const { mutateAsync, isPending } = useCreateOffboardingTemplate();

  async function onSubmit(data: any) {
    try {
      await mutateAsync({
        name: data.name,
        description: data.description || undefined,
        tasks: data.tasks.map((t: any, i: number) => ({
          title: t.title,
          description: t.description || undefined,
          assignedRole: t.assignedRole,
          dueBeforeDays: Number(t.dueBeforeDays),
          isRequired: true,
          displayOrder: i,
        })),
      });
      toast.success('Template created');
      reset();
      onClose();
    } catch {
      toast.error('Failed to create template');
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Create Offboarding Template</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1"><Label>Template Name *</Label><Input {...register('name', { required: true })} placeholder="e.g. Standard Offboarding" /></div>
          <div className="space-y-1"><Label>Description</Label><Textarea {...register('description')} rows={2} /></div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Tasks</Label>
              <Button type="button" size="sm" variant="outline" onClick={() => { append({ title: '', description: '', assignedRole: 'HR', dueBeforeDays: 0, isRequired: true, displayOrder: 0 }); }}>
                <Plus className="h-3 w-3 mr-1" />Add Task
              </Button>
            </div>
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input {...register(`tasks.${index}.title`, { required: true })} placeholder="Task title" className="flex-1" />
                    <Button type="button" size="icon" variant="ghost" className="shrink-0 text-red-500" onClick={() => { remove(index); }}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Assigned Role</Label>
                      <Select value={watch(`tasks.${index}.assignedRole`)} onValueChange={(v) => { setValue(`tasks.${index}.assignedRole`, v as AssignedRole); }}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(['HR', 'IT', 'FINANCE', 'MANAGER', 'EMPLOYEE'] as AssignedRole[]).map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Due Before (days)</Label>
                      <Input type="number" min={0} {...register(`tasks.${index}.dueBeforeDays`)} className="h-8 text-xs" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
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

function AssignDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { register, handleSubmit, reset, setValue, watch } = useForm({ defaultValues: { employeeId: '', templateId: '', lastWorkingDate: '' } });
  const { data: templates } = useOffboardingTemplates();
  const { data: employeesData } = useEmployees({ limit: 100 });
  const { mutateAsync, isPending } = useCreateOffboardingAssignment();

  async function onSubmit(data: any) {
    try {
      await mutateAsync(data);
      toast.success('Offboarding initiated');
      reset();
      onClose();
    } catch {
      toast.error('Failed to initiate offboarding');
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Initiate Offboarding</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>Employee *</Label>
            <Select value={watch('employeeId')} onValueChange={(v) => { setValue('employeeId', v); }}>
              <SelectTrigger><SelectValue placeholder="Select employee..." /></SelectTrigger>
              <SelectContent>
                {(employeesData?.employees ?? []).map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Template *</Label>
            <Select value={watch('templateId')} onValueChange={(v) => { setValue('templateId', v); }}>
              <SelectTrigger><SelectValue placeholder="Select template..." /></SelectTrigger>
              <SelectContent>
                {(templates ?? []).map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label>Last Working Date *</Label><Input type="date" {...register('lastWorkingDate', { required: true })} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending || !watch('employeeId') || !watch('templateId')}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Initiate
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ExitInterviewDialog({ assignmentId, open, onClose }: { assignmentId: string; open: boolean; onClose: () => void }) {
  const { data: existing } = useExitInterview(assignmentId);
  const { mutateAsync, isPending } = useSubmitExitInterview();
  const { register, handleSubmit, setValue, watch } = useForm({ defaultValues: { reasonForLeaving: '', suggestions: '', jobSatisfaction: 3, managementRating: 3, workEnvRating: 3, compensationRating: 3, wouldRecommend: true } });

  async function onSubmit(data: any) {
    try {
      await mutateAsync({
        assignmentId,
        reasonForLeaving: data.reasonForLeaving || undefined,
        suggestions: data.suggestions || undefined,
        jobSatisfaction: Number(data.jobSatisfaction),
        managementRating: Number(data.managementRating),
        workEnvRating: Number(data.workEnvRating),
        compensationRating: Number(data.compensationRating),
        wouldRecommend: data.wouldRecommend === 'true' || data.wouldRecommend === true,
      });
      toast.success('Exit interview submitted');
      onClose();
    } catch {
      toast.error('Failed to submit');
    }
  }

  const RatingRow = ({ label, field }: { label: string; field: 'jobSatisfaction' | 'managementRating' | 'workEnvRating' | 'compensationRating' }) => (
    <div className="flex items-center justify-between">
      <Label className="text-sm">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => { setValue(field, n); }}
            className={cn('h-7 w-7 rounded text-sm transition-colors', Number(watch(field)) >= n ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400')}>★</button>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Exit Interview</DialogTitle></DialogHeader>
        {existing ? (
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Exit interview already submitted.</p>
            {existing.reasonForLeaving && <p className="text-sm"><span className="font-medium">Reason:</span> {existing.reasonForLeaving}</p>}
            {existing.suggestions && <p className="text-sm"><span className="font-medium">Suggestions:</span> {existing.suggestions}</p>}
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1"><Label>Reason for Leaving</Label><Textarea {...register('reasonForLeaving')} rows={2} /></div>
            <div className="space-y-3 rounded-lg border p-3">
              <p className="text-sm font-medium">Ratings</p>
              <RatingRow label="Job Satisfaction" field="jobSatisfaction" />
              <RatingRow label="Management" field="managementRating" />
              <RatingRow label="Work Environment" field="workEnvRating" />
              <RatingRow label="Compensation" field="compensationRating" />
            </div>
            <div className="space-y-1">
              <Label>Would you recommend us as an employer?</Label>
              <Select value={String(watch('wouldRecommend'))} onValueChange={(v) => { setValue('wouldRecommend', v === 'true'); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Suggestions for Improvement</Label><Textarea {...register('suggestions')} rows={3} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isPending}>{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AssignmentDetailDialog({ assignmentId, open, onClose }: { assignmentId: string | null; open: boolean; onClose: () => void }) {
  const [exitOpen, setExitOpen] = useState(false);
  const { data: assignment, isLoading } = useOffboardingAssignment(assignmentId);
  const { mutateAsync: updateTask } = useUpdateOffboardingTask();

  const totalTasks = assignment?.tasks?.length ?? 0;
  const doneTasks = assignment?.tasks?.filter((t) => t.status !== 'PENDING').length ?? 0;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {assignment ? `${assignment.employee.firstName} ${assignment.employee.lastName} — Offboarding` : 'Loading...'}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : assignment ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Progress value={progress} className="flex-1 h-2" />
              <span className="text-xs text-muted-foreground w-14 text-right">{doneTasks}/{totalTasks} done</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Last Working Date: {new Date(assignment.lastWorkingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>

            <div className="space-y-2">
              {(assignment.tasks ?? []).map((task) => (
                <div key={task.id} className={cn('flex items-start gap-3 rounded-lg border p-3', task.status === 'COMPLETED' && 'border-green-200 bg-green-50', task.status === 'SKIPPED' && 'opacity-50')}>
                  <button
                    className="mt-0.5 shrink-0"
                    onClick={() => {
                      const next: OffboardingTaskStatus = task.status === 'PENDING' ? 'COMPLETED' : task.status === 'COMPLETED' ? 'SKIPPED' : 'PENDING';
                      void updateTask({ assignmentId: assignment.id, taskId: task.id, status: next });
                    }}
                  >
                    {task.status === 'COMPLETED' ? <CheckCircle2 className="h-5 w-5 text-green-600" /> :
                      task.status === 'SKIPPED' ? <SkipForward className="h-5 w-5 text-gray-400" /> :
                      <Circle className="h-5 w-5 text-gray-300" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium', task.status === 'COMPLETED' && 'line-through text-muted-foreground')}>{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn('inline-flex rounded-full px-1.5 py-0.5 text-xs font-medium', ROLE_COLORS[task.assignedRole as AssignedRole])}>
                        {task.assignedRole}
                      </span>
                      {task.dueDate && <span className="text-xs text-muted-foreground">Due: {new Date(task.dueDate).toLocaleDateString('en-IN')}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="outline" className="w-full" onClick={() => { setExitOpen(true); }}>
              Fill Exit Interview
            </Button>
          </div>
        ) : null}

        {assignmentId && exitOpen && (
          <ExitInterviewDialog assignmentId={assignmentId} open={exitOpen} onClose={() => { setExitOpen(false); }} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function AssignmentsTab() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const role = useAuthStore((s) => s.user?.role);
  const isHR = HR_ROLES.includes(role ?? '');
  const { data: assignments, isLoading } = useOffboardingAssignments();

  return (
    <div className="space-y-4">
      {isHR && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { setAssignOpen(true); }}><Plus className="mr-2 h-4 w-4" />Initiate Offboarding</Button>
        </div>
      )}
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-muted h-20 animate-pulse rounded-lg" />)}</div>
      ) : !assignments?.length ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-12">
          <UserMinus className="text-muted-foreground h-10 w-10" />
          <p className="text-muted-foreground text-sm">No offboarding assignments yet.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
            const total = a._count?.tasks ?? 0;
            const done = a.completedTasks ?? 0;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <Card key={a.id} className="cursor-pointer transition-shadow hover:shadow-sm" onClick={() => { setSelectedId(a.id); }}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg shrink-0">
                        <UserMinus className="text-primary h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{a.employee.firstName} {a.employee.lastName}</CardTitle>
                        <p className="text-muted-foreground text-xs">{a.template.name} · LWD: {new Date(a.lastWorkingDate).toLocaleDateString('en-IN')}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                        a.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      )}>
                        {a.status === 'COMPLETED' ? 'Completed' : 'In Progress'}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">{done}/{total} tasks · {pct}%</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <Progress value={pct} className="h-1.5" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <AssignmentDetailDialog assignmentId={selectedId} open={!!selectedId} onClose={() => { setSelectedId(null); }} />
      {isHR && <AssignDialog open={assignOpen} onClose={() => { setAssignOpen(false); }} />}
    </div>
  );
}

function TemplatesTab() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data: templates, isLoading } = useOffboardingTemplates();
  const { mutateAsync: deleteTemplate } = useDeleteOffboardingTemplate();

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setCreateOpen(true); }}><Plus className="mr-2 h-4 w-4" />New Template</Button>
      </div>
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="bg-muted h-20 animate-pulse rounded-lg" />)}</div>
      ) : !templates?.length ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-12">
          <UserMinus className="text-muted-foreground h-10 w-10" />
          <p className="text-muted-foreground text-sm">No templates yet. Create one to get started.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <Card key={t.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{t.name}</CardTitle>
                    {t.description && <p className="text-muted-foreground text-sm">{t.description}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{t._count?.tasks ?? 0} tasks · {t._count?.assignments ?? 0} assignments</p>
                  </div>
                  <Button size="sm" variant="ghost" className="text-red-500 h-7 px-2 text-xs shrink-0" onClick={() => { void deleteTemplate(t.id); }}>Remove</Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
      <CreateTemplateDialog open={createOpen} onClose={() => { setCreateOpen(false); }} />
    </div>
  );
}

export default function OffboardingPage() {
  const role = useAuthStore((s) => s.user?.role);
  const isHR = HR_ROLES.includes(role ?? '');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Offboarding</h1>
        <p className="text-muted-foreground">Manage employee exit workflows and exit interviews</p>
      </div>
      <Tabs defaultValue="assignments">
        <TabsList>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          {isHR && <TabsTrigger value="templates">Templates</TabsTrigger>}
        </TabsList>
        <TabsContent value="assignments" className="mt-4"><AssignmentsTab /></TabsContent>
        {isHR && <TabsContent value="templates" className="mt-4"><TemplatesTab /></TabsContent>}
      </Tabs>
    </div>
  );
}
