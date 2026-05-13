import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CheckCircle2,
  Circle,
  Loader2,
  Plus,
  Trash2,
  Users,
  LayoutTemplate,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/stores/auth.store';
import { useEmployees } from '@/hooks/useEmployees';
import {
  useOnboardingTemplates,
  useCreateOnboardingTemplate,
  useDeleteOnboardingTemplate,
  useOnboardingAssignments,
  useOnboardingAssignment,
  useCreateOnboardingAssignment,
  useUpdateOnboardingTask,
} from '@/hooks/useOnboarding';
import type { AssignedRole, OnboardingAssignment, TaskStatus } from '@/hooks/useOnboarding';
import { cn } from '@/lib/utils';

const ROLE_COLORS: Record<AssignedRole, string> = {
  HR: 'bg-purple-100 text-purple-700',
  IT: 'bg-blue-100 text-blue-700',
  FINANCE: 'bg-green-100 text-green-700',
  MANAGER: 'bg-orange-100 text-orange-700',
  EMPLOYEE: 'bg-slate-100 text-slate-700',
};

const TASK_STATUS_ICON: Record<TaskStatus, React.ReactNode> = {
  PENDING: <Circle className="h-4 w-4 text-muted-foreground" />,
  COMPLETED: <CheckCircle2 className="h-4 w-4 text-green-600" />,
  SKIPPED: <Circle className="h-4 w-4 text-slate-400 opacity-50" />,
};

const taskDefSchema = z.object({
  title: z.string().min(1, 'Required'),
  description: z.string().optional(),
  assignedRole: z.enum(['HR', 'IT', 'FINANCE', 'MANAGER', 'EMPLOYEE']),
  dueAfterDays: z.coerce.number().int().min(0),
  isRequired: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
});

const createTemplateSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
  tasks: z.array(taskDefSchema).min(1, 'Add at least one task'),
});
type CreateTemplateInput = z.infer<typeof createTemplateSchema>;

function CreateTemplateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { mutate, isPending } = useCreateOnboardingTemplate();
  const form = useForm<CreateTemplateInput>({
    resolver: zodResolver(createTemplateSchema),
    defaultValues: {
      name: '',
      description: '',
      tasks: [{ title: '', assignedRole: 'HR', dueAfterDays: 0, isRequired: true, displayOrder: 0 }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'tasks' });

  function onSubmit(data: CreateTemplateInput) {
    mutate(
      {
        name: data.name,
        ...(data.description ? { description: data.description } : {}),
        tasks: data.tasks.map((t, i) => ({
          title: t.title,
          ...(t.description ? { description: t.description } : {}),
          assignedRole: t.assignedRole,
          dueAfterDays: t.dueAfterDays,
          isRequired: t.isRequired,
          displayOrder: i,
        })),
      },
      {
        onSuccess: () => {
          toast.success('Template created');
          form.reset();
          onClose();
        },
        onError: () => toast.error('Failed to create template'),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Onboarding Template</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Template Name</Label>
            <Input placeholder="e.g. Standard Employee Onboarding" {...form.register('name')} />
            {form.formState.errors.name && (
              <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea rows={2} placeholder="Brief notes about this template" {...form.register('description')} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Tasks</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  append({ title: '', assignedRole: 'HR', dueAfterDays: 0, isRequired: true, displayOrder: fields.length });
                }}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add Task
              </Button>
            </div>
            {fields.map((field, index) => (
              <div key={field.id} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Task {index + 1}</span>
                  {fields.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => { remove(index); }}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
                <Input placeholder="Task title" {...form.register(`tasks.${index}.title`)} />
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={form.watch(`tasks.${index}.assignedRole`)}
                    onValueChange={(v) => { form.setValue(`tasks.${index}.assignedRole`, v as AssignedRole); }}
                  >
                    <SelectTrigger><SelectValue placeholder="Assigned to" /></SelectTrigger>
                    <SelectContent>
                      {(['HR', 'IT', 'FINANCE', 'MANAGER', 'EMPLOYEE'] as AssignedRole[]).map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      placeholder="Due after (days)"
                      {...form.register(`tasks.${index}.dueAfterDays`)}
                    />
                  </div>
                </div>
              </div>
            ))}
            {form.formState.errors.tasks && (
              <p className="text-destructive text-xs">{form.formState.errors.tasks.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Template
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AssignDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { mutate, isPending } = useCreateOnboardingAssignment();
  const { data: templates } = useOnboardingTemplates();
  const { data: employeesData } = useEmployees({ limit: 100 });
  const [templateId, setTemplateId] = useState('');
  const [employeeId, setEmployeeId] = useState('');

  function onSubmit() {
    if (!templateId || !employeeId) return;
    mutate(
      { templateId, employeeId },
      {
        onSuccess: () => {
          toast.success('Onboarding assigned');
          setTemplateId('');
          setEmployeeId('');
          onClose();
        },
        onError: () => toast.error('Failed to assign onboarding'),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Onboarding</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Employee</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent>
                {employeesData?.employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.firstName} {e.lastName}
                    {e.designation ? ` — ${e.designation}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Template</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger><SelectValue placeholder="Select template" /></SelectTrigger>
              <SelectContent>
                {templates?.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={onSubmit} disabled={isPending || !templateId || !employeeId}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AssignmentDetailDialog({
  assignmentId,
  onClose,
}: {
  assignmentId: string | null;
  onClose: () => void;
}) {
  const { data: assignment } = useOnboardingAssignment(assignmentId);
  const { mutate: updateTask, isPending } = useUpdateOnboardingTask();

  if (!assignmentId) return null;

  function toggleTask(taskId: string, currentStatus: TaskStatus) {
    if (!assignmentId) return;
    const newStatus: TaskStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    updateTask(
      { assignmentId, taskId, status: newStatus },
      {
        onSuccess: () => toast.success(newStatus === 'COMPLETED' ? 'Task completed' : 'Task reopened'),
        onError: () => toast.error('Failed to update task'),
      },
    );
  }

  return (
    <Dialog open={!!assignmentId} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {assignment
              ? `${assignment.employee.firstName} ${assignment.employee.lastName} — ${assignment.template.name}`
              : '…'}
          </DialogTitle>
        </DialogHeader>
        {assignment && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant={assignment.status === 'COMPLETED' ? 'default' : 'secondary'}>
                {assignment.status.replace('_', ' ')}
              </Badge>
              {assignment.tasks && (
                <span className="text-muted-foreground text-xs">
                  {assignment.tasks.filter((t) => t.status === 'COMPLETED').length} / {assignment.tasks.length} tasks done
                </span>
              )}
            </div>
            <div className="space-y-2">
              {assignment.tasks?.map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border p-3',
                    task.status === 'COMPLETED' && 'bg-muted/50',
                  )}
                >
                  <button
                    onClick={() => { toggleTask(task.id, task.status); }}
                    disabled={isPending}
                    className="shrink-0"
                  >
                    {TASK_STATUS_ICON[task.status]}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium', task.status === 'COMPLETED' && 'line-through text-muted-foreground')}>
                      {task.title}
                    </p>
                    {task.dueDate && (
                      <p className="text-muted-foreground text-xs">
                        Due: {new Date(task.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </p>
                    )}
                  </div>
                  <span className={cn('shrink-0 inline-flex rounded-full px-2 py-0.5 text-xs font-medium', ROLE_COLORS[task.assignedRole])}>
                    {task.assignedRole}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

type Tab = 'assignments' | 'templates';

export default function OnboardingPage() {
  const role = useAuthStore((s) => s.user?.role);
  const isHR = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(role ?? '');
  const [tab, setTab] = useState<Tab>('assignments');
  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const { data: assignments, isLoading: loadingAssignments } = useOnboardingAssignments();
  const { data: templates, isLoading: loadingTemplates } = useOnboardingTemplates();
  const { mutate: deleteTemplate } = useDeleteOnboardingTemplate();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Onboarding</h1>
          <p className="text-muted-foreground">
            {isHR ? 'Manage employee onboarding workflows' : 'Track your onboarding checklist'}
          </p>
        </div>
        {isHR && (
          <div className="flex gap-2">
            {tab === 'templates' && (
              <Button variant="outline" onClick={() => { setShowCreate(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                New Template
              </Button>
            )}
            {tab === 'assignments' && (
              <Button onClick={() => { setShowAssign(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                Assign Onboarding
              </Button>
            )}
          </div>
        )}
      </div>

      {isHR && (
        <div className="flex gap-1 rounded-lg border p-1 w-fit">
          <button
            onClick={() => { setTab('assignments'); }}
            className={cn('flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors', tab === 'assignments' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
          >
            <Users className="h-4 w-4" />
            Assignments
          </button>
          <button
            onClick={() => { setTab('templates'); }}
            className={cn('flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors', tab === 'templates' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
          >
            <LayoutTemplate className="h-4 w-4" />
            Templates
          </button>
        </div>
      )}

      {/* Assignments tab */}
      {(tab === 'assignments' || !isHR) && (
        <>
          {loadingAssignments ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-muted h-20 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : !assignments?.length ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-16">
                <Users className="text-muted-foreground h-12 w-12" />
                <p className="text-muted-foreground text-sm">No onboarding assignments yet.</p>
                {isHR && <Button onClick={() => { setShowAssign(true); }}>Assign first onboarding</Button>}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {(assignments as OnboardingAssignment[]).map((a) => {
                const total = a._count?.tasks ?? 0;
                const done = a.completedTasks ?? 0;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <Card
                    key={a.id}
                    className="cursor-pointer transition-shadow hover:shadow-sm"
                    onClick={() => { setSelectedAssignmentId(a.id); }}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {a.employee.firstName} {a.employee.lastName}
                        </p>
                        <p className="text-muted-foreground text-xs truncate">
                          {a.template.name}
                          {a.employee.designation ? ` · ${a.employee.designation}` : ''}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1.5 flex-1 max-w-32 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{done}/{total} tasks</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={a.status === 'COMPLETED' ? 'default' : 'secondary'} className="text-xs">
                          {a.status.replace('_', ' ')}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Templates tab */}
      {tab === 'templates' && isHR && (
        <>
          {loadingTemplates ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-muted h-20 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : !templates?.length ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-16">
                <LayoutTemplate className="text-muted-foreground h-12 w-12" />
                <p className="text-muted-foreground text-sm">No templates yet.</p>
                <Button onClick={() => { setShowCreate(true); }}>Create first template</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {templates.map((t) => (
                <Card key={t.id} className="transition-shadow hover:shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-base">{t.name}</CardTitle>
                        {t.description && (
                          <p className="text-muted-foreground mt-0.5 text-xs">{t.description}</p>
                        )}
                        <p className="text-muted-foreground text-xs mt-1">
                          {t._count?.tasks ?? 0} task{(t._count?.tasks ?? 0) !== 1 ? 's' : ''}
                          {' · '}
                          {t._count?.assignments ?? 0} assignment{(t._count?.assignments ?? 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive shrink-0"
                        onClick={() => {
                          deleteTemplate(t.id, {
                            onSuccess: () => toast.success('Template deleted'),
                            onError: () => toast.error('Failed to delete template'),
                          });
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {isHR && <CreateTemplateDialog open={showCreate} onClose={() => { setShowCreate(false); }} />}
      {isHR && <AssignDialog open={showAssign} onClose={() => { setShowAssign(false); }} />}
      <AssignmentDetailDialog
        assignmentId={selectedAssignmentId}
        onClose={() => { setSelectedAssignmentId(null); }}
      />
    </div>
  );
}
