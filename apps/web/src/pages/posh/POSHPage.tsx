import { useState } from 'react';
import { ShieldAlert, Plus, ChevronDown, ChevronUp } from 'lucide-react';
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
import { usePOSHCases, useCreatePOSHCase, useUpdatePOSHCaseStatus, useAddPOSHUpdate } from '@/hooks/usePOSH';
import { useAuthStore } from '@/stores/auth.store';
import { format } from 'date-fns';

const STATUS_META: Record<string, { label: string; color: string }> = {
  OPEN: { label: 'Open', color: 'bg-yellow-100 text-yellow-700' },
  UNDER_INVESTIGATION: { label: 'Under Investigation', color: 'bg-blue-100 text-blue-700' },
  RESOLVED: { label: 'Resolved', color: 'bg-green-100 text-green-700' },
  CLOSED: { label: 'Closed', color: 'bg-gray-100 text-gray-600' },
};

const STATUSES = ['OPEN', 'UNDER_INVESTIGATION', 'RESOLVED', 'CLOSED'];

export default function POSHPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data: cases, isLoading } = usePOSHCases();
  const user = useAuthStore((s) => s.user);
  const isHR = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(user?.role ?? '');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-500" />
            POSH Case Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Prevention of Sexual Harassment cases</p>
        </div>
        <Button onClick={() => setShowCreate(true)} variant="destructive">
          <Plus className="w-4 h-4 mr-2" /> File Case
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : !cases?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShieldAlert className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No cases on record</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map((c: any) => {
            const meta = (STATUS_META[c.status] ?? STATUS_META['OPEN'])!;
            const isOpen = expanded === c.id;
            return (
              <Card key={c.id} className="border shadow-sm">
                <CardContent className="pt-3 pb-3 px-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-muted-foreground">{c.caseNumber}</span>
                        <Badge variant="outline" className={`text-xs ${meta.color}`}>{meta.label}</Badge>
                        {c.isAnonymous && (
                          <Badge variant="outline" className="text-xs bg-gray-100 text-gray-500">Anonymous</Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium mt-1">{c.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Filed {format(new Date(c.createdAt), 'dd MMM yyyy')}
                        {c.incidentDate && ` · Incident: ${format(new Date(c.incidentDate), 'dd MMM yyyy')}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isHR && (
                        <UpdateStatusButton caseId={c.id} currentStatus={c.status} />
                      )}
                      <button onClick={() => setExpanded(isOpen ? null : c.id)} className="text-muted-foreground hover:text-foreground">
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-3 border-t pt-3 space-y-2">
                      {c.updates?.length ? (
                        <div className="space-y-1">
                          {c.updates.map((u: any) => (
                            <div key={u.id} className="text-xs text-muted-foreground flex gap-2">
                              <span className="shrink-0">{format(new Date(u.createdAt), 'dd MMM')}</span>
                              <span>{u.note}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No updates yet.</p>
                      )}
                      {isHR && <AddUpdateInline caseId={c.id} />}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreateCaseDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}

function UpdateStatusButton({ caseId, currentStatus }: { caseId: string; currentStatus: string }) {
  const update = useUpdatePOSHCaseStatus();
  const next = STATUSES[STATUSES.indexOf(currentStatus) + 1];
  if (!next) return null;
  return (
    <Button size="sm" variant="outline" disabled={update.isPending}
      onClick={() => update.mutate({ id: caseId, status: next })}>
      Mark {STATUS_META[next]?.label}
    </Button>
  );
}

function AddUpdateInline({ caseId }: { caseId: string }) {
  const [note, setNote] = useState('');
  const add = useAddPOSHUpdate();
  return (
    <div className="flex gap-2 mt-2">
      <Input placeholder="Add update note..." value={note} onChange={(e) => setNote(e.target.value)} className="text-xs h-7" />
      <Button size="sm" variant="outline" className="h-7 text-xs" disabled={!note.trim() || add.isPending}
        onClick={() => { add.mutate({ id: caseId, note }); setNote(''); }}>
        Add
      </Button>
    </div>
  );
}

function CreateCaseDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [description, setDescription] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const create = useCreatePOSHCase();

  async function handleSubmit() {
    if (!description) return;
    await create.mutateAsync({ description, incidentDate: incidentDate || undefined, isAnonymous });
    setDescription(''); setIncidentDate(''); setIsAnonymous(false);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>File POSH Case</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Description of Incident</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </div>
          <div>
            <Label>Date of Incident</Label>
            <Input type="date" value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />
            <span className="text-sm">File anonymously</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={!description || create.isPending}>
            File Case
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
