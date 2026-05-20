import { useState } from 'react';
import { ClipboardCheck, Plus, Star, ChevronDown, ChevronUp } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useInterviewScorecards,
  useCreateScorecard,
} from '@/hooks/useInterviewScorecards';
import { useAuthStore } from '@/stores/auth.store';
import { format } from 'date-fns';

const RECOMMENDATION_META: Record<string, { label: string; className: string }> = {
  STRONG_YES: { label: 'Strong Yes', className: 'bg-emerald-700 text-white' },
  YES: { label: 'Yes', className: 'bg-green-100 text-green-700' },
  MAYBE: { label: 'Maybe', className: 'bg-yellow-100 text-yellow-700' },
  NO: { label: 'No', className: 'bg-red-100 text-red-700' },
  STRONG_NO: { label: 'Strong No', className: 'bg-red-700 text-white' },
};

const DEFAULT_COMPETENCIES = [
  { name: 'Communication', rating: 3 },
  { name: 'Technical Skills', rating: 3 },
  { name: 'Culture Fit', rating: 3 },
];

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  );
}

export default function InterviewScorecardsPage() {
  const user = useAuthStore((s) => s.user);
  const isHROrManager = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'].includes(
    user?.role ?? ''
  );

  const { data: scorecards = [], isLoading } = useInterviewScorecards();
  const createScorecard = useCreateScorecard();

  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [form, setForm] = useState({
    candidateName: '',
    overallRating: 3,
    recommendation: 'YES',
    notes: '',
    competencies: DEFAULT_COMPETENCIES.map((c) => ({ ...c })),
  });

  async function handleCreate() {
    if (!form.candidateName) return;
    await createScorecard.mutateAsync({
      candidateName: form.candidateName,
      overallRating: form.overallRating,
      recommendation: form.recommendation,
      notes: form.notes || undefined,
      competencies: form.competencies,
    });
    setForm({
      candidateName: '',
      overallRating: 3,
      recommendation: 'YES',
      notes: '',
      competencies: DEFAULT_COMPETENCIES.map((c) => ({ ...c })),
    });
    setShowCreate(false);
  }

  function updateCompetencyRating(index: number, rating: number) {
    setForm((f) => {
      const updated = [...f.competencies];
      updated[index] = { ...updated[index]!, rating };
      return { ...f, competencies: updated };
    });
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <ClipboardCheck className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Interview Scorecards</h1>
            <p className="text-sm text-muted-foreground">
              Structured candidate evaluation records
            </p>
          </div>
        </div>
        {isHROrManager && (
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Create Scorecard
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      ) : scorecards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ClipboardCheck className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No scorecards yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Create a scorecard after completing an interview.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {scorecards.map((sc: any) => {
            const recMeta =
              RECOMMENDATION_META[sc.recommendation] ?? RECOMMENDATION_META['MAYBE'];
            const isOpen = expanded === sc.id;
            return (
              <Card key={sc.id} className="border shadow-sm">
                <CardContent className="pt-3 pb-3 px-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{sc.candidateName}</p>
                        <Badge variant="outline" className={`text-xs ${recMeta.className}`}>
                          {recMeta.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <StarRating rating={sc.overallRating} />
                        <span className="text-xs text-muted-foreground">
                          {sc.overallRating}/5
                        </span>
                      </div>
                      {sc.completedAt && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(sc.completedAt), 'dd MMM yyyy')}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setExpanded(isOpen ? null : sc.id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {isOpen && (
                    <div className="mt-3 border-t pt-3 space-y-3">
                      {sc.competencies?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2">
                            Competency Breakdown
                          </p>
                          <div className="space-y-1.5">
                            {sc.competencies.map((comp: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between">
                                <span className="text-sm">{comp.name}</span>
                                <StarRating rating={comp.rating} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {sc.notes && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">
                            Notes
                          </p>
                          <p className="text-sm text-muted-foreground">{sc.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Interview Scorecard</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Candidate Name *</Label>
              <Input
                value={form.candidateName}
                onChange={(e) => setForm((f) => ({ ...f, candidateName: e.target.value }))}
                placeholder="e.g. Priya Sharma"
              />
            </div>

            <div>
              <Label className="mb-2 block">Competency Ratings</Label>
              <div className="space-y-3">
                {form.competencies.map((comp, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-4">
                    <span className="text-sm flex-1">{comp.name}</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => updateCompetencyRating(idx, val)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`h-5 w-5 transition-colors ${
                              val <= comp.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground/30 hover:text-yellow-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Overall Rating</Label>
                <Select
                  value={String(form.overallRating)}
                  onValueChange={(v) => setForm((f) => ({ ...f, overallRating: Number(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} / 5
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Recommendation</Label>
                <Select
                  value={form.recommendation}
                  onValueChange={(v) => setForm((f) => ({ ...f, recommendation: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RECOMMENDATION_META).map(([key, val]) => (
                      <SelectItem key={key} value={key}>
                        {val.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional observations about the candidate…"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!form.candidateName || createScorecard.isPending}
            >
              {createScorecard.isPending ? 'Saving…' : 'Save Scorecard'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
