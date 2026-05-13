import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Headphones, Loader2, MessageCircle, Plus } from 'lucide-react';
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
import {
  useHelpDeskTickets,
  useHelpDeskTicket,
  useCreateTicket,
  useUpdateTicketStatus,
  useAddComment,
} from '@/hooks/useHelpDesk';
import type { TicketStatus, TicketCategory, TicketPriority } from '@/hooks/useHelpDesk';
import { cn } from '@/lib/utils';

const createSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  description: z.string().min(10, 'Please describe the issue in more detail'),
  category: z.enum(['GENERAL', 'PAYROLL', 'ATTENDANCE', 'LEAVE', 'IT', 'HR', 'OTHER']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
});
type CreateInput = z.infer<typeof createSchema>;

const CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: 'GENERAL', label: 'General' },
  { value: 'PAYROLL', label: 'Payroll' },
  { value: 'ATTENDANCE', label: 'Attendance' },
  { value: 'LEAVE', label: 'Leave' },
  { value: 'IT', label: 'IT Support' },
  { value: 'HR', label: 'HR' },
  { value: 'OTHER', label: 'Other' },
];

const PRIORITIES: { value: TicketPriority; label: string }[] = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

const STATUS_COLORS: Record<TicketStatus, string> = {
  OPEN: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-600',
};

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[status])}>
      {status.replace('_', ' ')}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', PRIORITY_COLORS[priority])}>
      {priority}
    </span>
  );
}

function CreateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { mutate, isPending } = useCreateTicket();
  const form = useForm<CreateInput>({
    resolver: zodResolver(createSchema),
    defaultValues: { subject: '', description: '', category: 'GENERAL', priority: 'MEDIUM' },
  });

  function onSubmit(data: CreateInput) {
    mutate(data, {
      onSuccess: () => {
        toast.success('Ticket created');
        form.reset();
        onClose();
      },
      onError: () => toast.error('Failed to create ticket'),
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Raise a Support Ticket</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input placeholder="Brief summary of the issue" {...form.register('subject')} />
            {form.formState.errors.subject && (
              <p className="text-destructive text-xs">{form.formState.errors.subject.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea rows={4} placeholder="Describe the issue in detail…" {...form.register('description')} />
            {form.formState.errors.description && (
              <p className="text-destructive text-xs">{form.formState.errors.description.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={form.watch('category')}
                onValueChange={(v) => { form.setValue('category', v as TicketCategory); }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={form.watch('priority')}
                onValueChange={(v) => { form.setValue('priority', v as TicketPriority); }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TicketDetailDialog({
  ticketId,
  isStaff,
  onClose,
}: {
  ticketId: string | null;
  isStaff: boolean;
  onClose: () => void;
}) {
  const [comment, setComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const { data: ticket } = useHelpDeskTicket(ticketId ?? '');
  const { mutate: addComment, isPending: addingComment } = useAddComment();
  const { mutate: updateStatus, isPending: updatingStatus } = useUpdateTicketStatus();

  if (!ticketId) return null;

  function submitComment() {
    if (!comment.trim() || !ticketId) return;
    addComment(
      { ticketId, body: comment, isInternal },
      {
        onSuccess: () => {
          setComment('');
          toast.success('Comment added');
        },
        onError: () => toast.error('Failed to add comment'),
      },
    );
  }

  return (
    <Dialog open={!!ticketId} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ticket?.subject ?? '…'}</DialogTitle>
        </DialogHeader>
        {ticket && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <Badge variant="outline" className="text-xs">{ticket.category}</Badge>
              {ticket.employee && (
                <span className="text-muted-foreground text-xs">
                  by {ticket.employee.firstName} {ticket.employee.lastName}
                </span>
              )}
            </div>

            <div className="rounded-lg border p-3">
              <p className="text-sm">{ticket.description}</p>
            </div>

            {isStaff && ticket.status !== 'CLOSED' && (
              <div className="flex items-center gap-3">
                <Label className="shrink-0 text-sm">Update status:</Label>
                <Select
                  value={ticket.status}
                  onValueChange={(v) => {
                    updateStatus(
                      { id: ticket.id, status: v as TicketStatus },
                      { onSuccess: () => toast.success('Status updated'), onError: () => toast.error('Failed') },
                    );
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const).map((s) => (
                      <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {updatingStatus && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium">Comments ({ticket.comments?.length ?? 0})</p>
              {ticket.comments?.length === 0 && (
                <p className="text-muted-foreground text-sm">No comments yet.</p>
              )}
              {ticket.comments?.map((c) => (
                <div
                  key={c.id}
                  className={cn('rounded-lg border p-3', c.isInternal && 'border-dashed bg-yellow-50 dark:bg-yellow-950/20')}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-xs font-medium">{c.authorId.slice(0, 8)}…</span>
                    {c.isInternal && <Badge variant="outline" className="text-xs">Internal</Badge>}
                    <span className="text-muted-foreground text-xs ml-auto">
                      {new Date(c.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm">{c.body}</p>
                </div>
              ))}
            </div>

            {ticket.status !== 'CLOSED' && (
              <div className="space-y-2 border-t pt-4">
                <Textarea
                  rows={3}
                  placeholder="Add a comment…"
                  value={comment}
                  onChange={(e) => { setComment(e.target.value); }}
                />
                <div className="flex items-center justify-between">
                  {isStaff && (
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => { setIsInternal(e.target.checked); }}
                        className="accent-primary"
                      />
                      Internal note (hidden from employee)
                    </label>
                  )}
                  <Button
                    size="sm"
                    className="ml-auto"
                    onClick={submitComment}
                    disabled={addingComment || !comment.trim()}
                  >
                    {addingComment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Comment
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function HelpDeskPage() {
  const role = useAuthStore((s) => s.user?.role);
  const isStaff = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'].includes(role ?? '');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: tickets, isLoading } = useHelpDeskTickets();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Help Desk</h1>
          <p className="text-muted-foreground">
            {isStaff ? 'Manage support tickets' : 'Get help from HR & IT support'}
          </p>
        </div>
        <Button onClick={() => { setShowCreate(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          New Ticket
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-muted h-20 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : tickets?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16">
            <Headphones className="text-muted-foreground h-12 w-12" />
            <p className="text-muted-foreground text-sm">No tickets yet.</p>
            <Button onClick={() => { setShowCreate(true); }}>Raise a ticket</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets?.map((t) => (
            <Card
              key={t.id}
              className="cursor-pointer transition-shadow hover:shadow-sm"
              onClick={() => { setSelectedId(t.id); }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base">{t.subject}</CardTitle>
                    {t.employee && (
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {t.employee.firstName} {t.employee.lastName}
                        {t.employee.designation ? ` · ${t.employee.designation}` : ''}
                        {' · '}
                        {new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-start gap-2">
                    <StatusBadge status={t.status} />
                    <PriorityBadge priority={t.priority} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground line-clamp-2 text-sm">{t.description}</p>
                <div className="mt-2 flex items-center gap-3">
                  <Badge variant="outline" className="text-xs">{t.category}</Badge>
                  {(t._count?.comments ?? 0) > 0 && (
                    <span className="text-muted-foreground flex items-center gap-1 text-xs">
                      <MessageCircle className="h-3 w-3" />
                      {t._count?.comments}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateDialog open={showCreate} onClose={() => { setShowCreate(false); }} />
      <TicketDetailDialog
        ticketId={selectedId}
        isStaff={isStaff}
        onClose={() => { setSelectedId(null); }}
      />
    </div>
  );
}
