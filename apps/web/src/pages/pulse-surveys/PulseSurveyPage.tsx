import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  BarChart2,
  Loader2,
  Plus,
  Trash2,
  ClipboardCheck,
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
import {
  useSurveys,
  useSurveyDetail,
  useSurveyResults,
  useCreateSurvey,
  useUpdateSurveyStatus,
  useSubmitSurveyResponse,
} from '@/hooks/useSurveys';
import type { SurveyStatus, QuestionType, SurveySummary } from '@/hooks/useSurveys';
import { cn } from '@/lib/utils';
import { DialogContentSkeleton } from '@/components/ui/skeleton-patterns';

const STATUS_COLORS: Record<SurveyStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  ACTIVE: 'bg-green-100 text-green-700',
  CLOSED: 'bg-slate-100 text-slate-600',
};

const questionSchema = z.object({
  questionText: z.string().min(1, 'Required'),
  questionType: z.enum(['RATING_5', 'RATING_10', 'TEXT', 'MULTIPLE_CHOICE']),
  isRequired: z.boolean().default(true),
});

const createSurveySchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  isAnonymous: z.boolean().default(false),
  questions: z.array(questionSchema).min(1, 'Add at least one question'),
});
type CreateSurveyInput = z.infer<typeof createSurveySchema>;

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  RATING_5: 'Rating (1–5)',
  RATING_10: 'Rating (1–10)',
  TEXT: 'Open Text',
  MULTIPLE_CHOICE: 'Multiple Choice',
};

function CreateSurveyDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { mutate, isPending } = useCreateSurvey();
  const form = useForm<CreateSurveyInput>({
    resolver: zodResolver(createSurveySchema),
    defaultValues: {
      title: '',
      description: '',
      isAnonymous: false,
      questions: [{ questionText: '', questionType: 'RATING_5', isRequired: true }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'questions' });

  function onSubmit(data: CreateSurveyInput) {
    mutate(
      {
        title: data.title,
        ...(data.description ? { description: data.description } : {}),
        isAnonymous: data.isAnonymous,
        questions: data.questions.map((q, i) => ({
          questionText: q.questionText,
          questionType: q.questionType,
          isRequired: q.isRequired,
          displayOrder: i,
        })),
      },
      {
        onSuccess: () => {
          toast.success('Survey created');
          form.reset();
          onClose();
        },
        onError: () => toast.error('Failed to create survey'),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Pulse Survey</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input placeholder="e.g. Q2 Employee Pulse" {...form.register('title')} />
            {form.formState.errors.title && (
              <p className="text-destructive text-xs">{form.formState.errors.title.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea rows={2} placeholder="Brief description of survey purpose" {...form.register('description')} />
          </div>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={form.watch('isAnonymous')}
              onChange={(e) => { form.setValue('isAnonymous', e.target.checked); }}
              className="accent-primary h-4 w-4"
            />
            <span className="text-sm">Anonymous responses</span>
          </label>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Questions</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { append({ questionText: '', questionType: 'RATING_5', isRequired: true }); }}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add Question
              </Button>
            </div>
            {fields.map((field, index) => (
              <div key={field.id} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Q{index + 1}</span>
                  {fields.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => { remove(index); }}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
                <Input
                  placeholder="Enter your question"
                  {...form.register(`questions.${index}.questionText`)}
                />
                <Select
                  value={form.watch(`questions.${index}.questionType`)}
                  onValueChange={(v) => { form.setValue(`questions.${index}.questionType`, v as QuestionType); }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(QUESTION_TYPE_LABELS) as [QuestionType, string][]).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
            {form.formState.errors.questions && (
              <p className="text-destructive text-xs">{form.formState.errors.questions.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Survey
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FillSurveyDialog({ surveyId, onClose }: { surveyId: string | null; onClose: () => void }) {
  const { data: survey } = useSurveyDetail(surveyId);
  const { mutate, isPending } = useSubmitSurveyResponse(surveyId ?? '');
  const [answers, setAnswers] = useState<Record<string, { ratingValue?: number; textValue?: string }>>({});

  if (!surveyId || !survey) return null;

  function setRating(qId: string, val: number) {
    setAnswers((prev) => ({ ...prev, [qId]: { ratingValue: val } }));
  }
  function setText(qId: string, val: string) {
    setAnswers((prev) => ({ ...prev, [qId]: { textValue: val } }));
  }

  function submit() {
    const payload = survey!.questions.map((q) => ({
      questionId: q.id,
      ...answers[q.id],
    }));
    mutate(
      { answers: payload },
      {
        onSuccess: () => {
          toast.success('Response submitted!');
          setAnswers({});
          onClose();
        },
        onError: () => toast.error('Failed to submit response'),
      },
    );
  }

  return (
    <Dialog open={!!surveyId} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{survey.title}</DialogTitle>
        </DialogHeader>
        {survey.description && (
          <p className="text-muted-foreground text-sm">{survey.description}</p>
        )}
        <div className="space-y-6">
          {survey.questions.map((q, idx) => (
            <div key={q.id} className="space-y-2">
              <Label className="text-sm font-medium">
                {idx + 1}. {q.questionText}
                {q.isRequired && <span className="text-destructive ml-1">*</span>}
              </Label>
              {(q.questionType === 'RATING_5' || q.questionType === 'RATING_10') && (
                <div className="flex gap-2 flex-wrap">
                  {Array.from({ length: q.questionType === 'RATING_5' ? 5 : 10 }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => { setRating(q.id, n); }}
                      className={cn(
                        'h-9 w-9 rounded-md border text-sm font-medium transition-colors',
                        answers[q.id]?.ratingValue === n
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'hover:bg-muted',
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              )}
              {q.questionType === 'TEXT' && (
                <Textarea
                  rows={3}
                  placeholder="Your answer…"
                  value={answers[q.id]?.textValue ?? ''}
                  onChange={(e) => { setText(q.id, e.target.value); }}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Response
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ResultsDialog({ surveyId, onClose }: { surveyId: string | null; onClose: () => void }) {
  const { data: results, isLoading } = useSurveyResults(surveyId);

  return (
    <Dialog open={!!surveyId} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Survey Results</DialogTitle>
        </DialogHeader>
        {isLoading && <DialogContentSkeleton rows={3} />}
        {results && (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              {results.totalResponses} response{results.totalResponses !== 1 ? 's' : ''} collected
            </p>
            {results.questions.map((q, i) => (
              <div key={q.questionId} className="rounded-lg border p-3 space-y-1">
                <p className="text-sm font-medium">{i + 1}. {q.questionText}</p>
                {(q.questionType === 'RATING_5' || q.questionType === 'RATING_10') && (
                  <p className="text-2xl font-bold">
                    {q.avg != null ? q.avg.toFixed(1) : '—'}
                    <span className="text-muted-foreground text-sm font-normal ml-1">
                      / {q.questionType === 'RATING_5' ? 5 : 10} avg ({q.count} responses)
                    </span>
                  </p>
                )}
                {q.questionType === 'TEXT' && q.responses && (
                  <div className="space-y-1 mt-2">
                    {q.responses.filter(Boolean).map((r, idx) => (
                      <p key={idx} className="text-sm text-muted-foreground border-l-2 pl-2">
                        {r}
                      </p>
                    ))}
                    {q.responses.filter(Boolean).length === 0 && (
                      <p className="text-muted-foreground text-sm">No text responses yet.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function PulseSurveyPage() {
  const role = useAuthStore((s) => s.user?.role);
  const isHR = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(role ?? '');
  const [showCreate, setShowCreate] = useState(false);
  const [fillSurveyId, setFillSurveyId] = useState<string | null>(null);
  const [resultsSurveyId, setResultsSurveyId] = useState<string | null>(null);
  const { data: surveys, isLoading } = useSurveys();
  const { mutate: updateStatus } = useUpdateSurveyStatus();

  function handleStatusChange(id: string, status: SurveyStatus) {
    updateStatus(
      { id, status },
      {
        onSuccess: () => toast.success('Status updated'),
        onError: () => toast.error('Failed to update status'),
      },
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Pulse Surveys</h1>
          <p className="text-muted-foreground">
            {isHR ? 'Create and track employee surveys' : 'Share your feedback with HR'}
          </p>
        </div>
        {isHR && (
          <Button onClick={() => { setShowCreate(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            New Survey
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-muted h-20 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : !surveys?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16">
            <BarChart2 className="text-muted-foreground h-12 w-12" />
            <p className="text-muted-foreground text-sm">No surveys yet.</p>
            {isHR && <Button onClick={() => { setShowCreate(true); }}>Create first survey</Button>}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(surveys as SurveySummary[]).map((s) => (
            <Card key={s.id} className="transition-shadow hover:shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base">{s.title}</CardTitle>
                    {s.description && (
                      <p className="text-muted-foreground mt-0.5 text-xs line-clamp-1">{s.description}</p>
                    )}
                    <div className="mt-1 flex items-center gap-2">
                      <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[s.status])}>
                        {s.status}
                      </span>
                      {s.isAnonymous && (
                        <Badge variant="outline" className="text-xs">Anonymous</Badge>
                      )}
                      <span className="text-muted-foreground text-xs">
                        {s._count.questions} question{s._count.questions !== 1 ? 's' : ''}
                        {isHR && ` · ${s._count.responses} response${s._count.responses !== 1 ? 's' : ''}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {isHR && (
                      <>
                        {s.status === 'DRAFT' && (
                          <Button size="sm" variant="outline" onClick={() => { handleStatusChange(s.id, 'ACTIVE'); }}>
                            Activate
                          </Button>
                        )}
                        {s.status === 'ACTIVE' && (
                          <Button size="sm" variant="outline" onClick={() => { handleStatusChange(s.id, 'CLOSED'); }}>
                            Close
                          </Button>
                        )}
                        {s.status !== 'DRAFT' && (
                          <Button size="sm" variant="outline" onClick={() => { setResultsSurveyId(s.id); }}>
                            <BarChart2 className="mr-1 h-3.5 w-3.5" />
                            Results
                          </Button>
                        )}
                      </>
                    )}
                    {!isHR && s.status === 'ACTIVE' && !s.hasResponded && (
                      <Button size="sm" onClick={() => { setFillSurveyId(s.id); }}>
                        <ClipboardCheck className="mr-1 h-3.5 w-3.5" />
                        Respond
                      </Button>
                    )}
                    {!isHR && s.hasResponded && (
                      <Badge variant="secondary" className="text-xs">Responded</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <CreateSurveyDialog open={showCreate} onClose={() => { setShowCreate(false); }} />
      <FillSurveyDialog surveyId={fillSurveyId} onClose={() => { setFillSurveyId(null); }} />
      <ResultsDialog surveyId={resultsSurveyId} onClose={() => { setResultsSurveyId(null); }} />
    </div>
  );
}
