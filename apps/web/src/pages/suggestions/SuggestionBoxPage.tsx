import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lightbulb, Loader2, MessageSquare, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/stores/auth.store';
import { useSuggestions, useSubmitSuggestion, useRespondToSuggestion } from '@/hooks/useSuggestions';
import type { Suggestion } from '@/hooks/useSuggestions';
import { cn } from '@/lib/utils';

const submitSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  content: z.string().min(10, 'Please provide more detail'),
  isAnonymous: z.boolean().default(false),
});
type SubmitInput = z.infer<typeof submitSchema>;

const respondSchema = z.object({
  response: z.string().min(1, 'Response is required'),
  status: z.enum(['REVIEWED', 'CLOSED']),
});
type RespondInput = z.infer<typeof respondSchema>;

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-800',
  REVIEWED: 'bg-yellow-100 text-yellow-800',
  CLOSED: 'bg-green-100 text-green-800',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[status] ?? 'bg-muted text-muted-foreground')}>
      {status}
    </span>
  );
}

function SubmitDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { mutate, isPending } = useSubmitSuggestion();
  const form = useForm<SubmitInput>({
    resolver: zodResolver(submitSchema),
    defaultValues: { title: '', content: '', isAnonymous: false },
  });

  function onSubmit(data: SubmitInput) {
    mutate(data, {
      onSuccess: () => {
        toast.success('Suggestion submitted!');
        form.reset();
        onClose();
      },
      onError: () => toast.error('Failed to submit suggestion'),
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit a Suggestion</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input placeholder="Brief title for your suggestion" {...form.register('title')} />
            {form.formState.errors.title && (
              <p className="text-destructive text-xs">{form.formState.errors.title.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Details</Label>
            <Textarea
              rows={5}
              placeholder="Describe your suggestion in detail…"
              {...form.register('content')}
            />
            {form.formState.errors.content && (
              <p className="text-destructive text-xs">{form.formState.errors.content.message}</p>
            )}
          </div>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={form.watch('isAnonymous')}
              onChange={(e) => { form.setValue('isAnonymous', e.target.checked); }}
              className="accent-primary h-4 w-4"
            />
            <span className="text-sm">Submit anonymously</span>
            {form.watch('isAnonymous')
              ? <EyeOff className="text-muted-foreground h-4 w-4" />
              : <Eye className="text-muted-foreground h-4 w-4" />}
          </label>
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

function RespondDialog({
  suggestion,
  onClose,
}: {
  suggestion: Suggestion | null;
  onClose: () => void;
}) {
  const { mutate, isPending } = useRespondToSuggestion();
  const form = useForm<RespondInput>({
    resolver: zodResolver(respondSchema),
    defaultValues: { response: '', status: 'REVIEWED' },
  });

  if (!suggestion) return null;

  function onSubmit(data: RespondInput) {
    mutate(
      { id: suggestion!.id, ...data },
      {
        onSuccess: () => {
          toast.success('Response saved');
          form.reset();
          onClose();
        },
        onError: () => toast.error('Failed to save response'),
      },
    );
  }

  return (
    <Dialog open={!!suggestion} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Respond to Suggestion</DialogTitle>
        </DialogHeader>
        <div className="mb-2 rounded-lg border p-3">
          <p className="font-semibold">{suggestion.title}</p>
          <p className="text-muted-foreground mt-1 text-sm">{suggestion.content}</p>
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Response</Label>
            <Textarea rows={4} placeholder="Write your response…" {...form.register('response')} />
            {form.formState.errors.response && (
              <p className="text-destructive text-xs">{form.formState.errors.response.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Mark as</Label>
            <div className="flex gap-3">
              {(['REVIEWED', 'CLOSED'] as const).map((s) => (
                <label key={s} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    value={s}
                    {...form.register('status')}
                    className="accent-primary"
                  />
                  <span className="text-sm">{s}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Response
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function SuggestionBoxPage() {
  const role = useAuthStore((s) => s.user?.role);
  const isHR = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(role ?? '');
  const [showSubmit, setShowSubmit] = useState(false);
  const [responding, setResponding] = useState<Suggestion | null>(null);
  const { data: suggestions, isLoading } = useSuggestions();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Suggestion Box</h1>
          <p className="text-muted-foreground">
            {isHR ? 'Review employee suggestions' : 'Share your ideas to improve the workplace'}
          </p>
        </div>
        {!isHR && (
          <Button onClick={() => { setShowSubmit(true); }}>
            <Lightbulb className="mr-2 h-4 w-4" />
            Submit Suggestion
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-muted h-20 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : suggestions?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16">
            <MessageSquare className="text-muted-foreground h-12 w-12" />
            <p className="text-muted-foreground text-sm">No suggestions yet.</p>
            {!isHR && (
              <Button onClick={() => { setShowSubmit(true); }}>Submit the first one</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {suggestions?.map((s) => (
            <Card key={s.id} className="transition-shadow hover:shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base">{s.title}</CardTitle>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {s.isAnonymous
                        ? 'Anonymous'
                        : s.employee
                        ? `${s.employee.firstName} ${s.employee.lastName}${s.employee.designation ? ` · ${s.employee.designation}` : ''}`
                        : '—'}
                      {' · '}
                      {new Date(s.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">{s.content}</p>
                {s.response && (
                  <div className="bg-muted rounded-md p-3">
                    <p className="text-muted-foreground mb-1 text-xs font-medium">HR Response</p>
                    <p className="text-sm">{s.response}</p>
                  </div>
                )}
                {isHR && s.status === 'OPEN' && (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setResponding(s); }}
                    >
                      Respond
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SubmitDialog open={showSubmit} onClose={() => { setShowSubmit(false); }} />
      <RespondDialog suggestion={responding} onClose={() => { setResponding(null); }} />
    </div>
  );
}
