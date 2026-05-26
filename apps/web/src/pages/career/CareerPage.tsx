import { useState } from 'react';
import { useSessionStorageState } from '@/hooks/useSessionStorageState';
import { Map, Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  useDesignations, useCreateDesignation,
  useCareerPaths, useCreateCareerPath, useDeleteCareerPath,
} from '@/hooks/useCareer';
import { useAuthStore } from '@/stores/auth.store';

export default function CareerPage() {
  const [tab, setTab] = useSessionStorageState<'map' | 'designations'>('career_tab', 'map');
  const [showNewDesignation, setShowNewDesignation] = useState(false);
  const [showNewPath, setShowNewPath] = useState(false);
  const { data: designations, isLoading: desLoading } = useDesignations();
  const { data: paths, isLoading: pathsLoading } = useCareerPaths();
  const deletePathMutation = useDeleteCareerPath();
  const user = useAuthStore((s) => s.user);
  const isHR = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(user?.role ?? '');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Map className="w-6 h-6 text-violet-500" />
            Career Paths
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Designations and progression paths</p>
        </div>
        {isHR && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowNewDesignation(true)}>
              <Plus className="w-4 h-4 mr-1" /> Designation
            </Button>
            <Button onClick={() => setShowNewPath(true)}>
              <Plus className="w-4 h-4 mr-1" /> Career Path
            </Button>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {(['map', 'designations'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}>
            {t === 'map' ? 'Career Map' : 'Designations'}
          </button>
        ))}
      </div>

      {tab === 'designations' && (
        <>
          {desLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
          ) : !designations?.length ? (
            <div className="text-center py-20 text-muted-foreground">No designations defined yet.</div>
          ) : (
            <div className="space-y-2">
              {designations.map((d: any) => (
                <Card key={d.id} className="border">
                  <CardContent className="py-3 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center">
                        L{d.level}
                      </span>
                      <div>
                        <p className="font-medium text-sm">{d.name}</p>
                        {d.department && <p className="text-xs text-muted-foreground">{d.department}</p>}
                      </div>
                    </div>
                    {d.skills?.length > 0 && (
                      <div className="flex gap-1 flex-wrap justify-end max-w-xs">
                        {d.skills.slice(0, 3).map((s: string) => (
                          <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                        ))}
                        {d.skills.length > 3 && <Badge variant="outline" className="text-xs">+{d.skills.length - 3}</Badge>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'map' && (
        <>
          {pathsLoading ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
          ) : !paths?.length ? (
            <div className="text-center py-20 text-muted-foreground">No career paths defined yet.</div>
          ) : (
            <div className="space-y-2">
              {paths.map((p: any) => (
                <Card key={p.id} className="border shadow-sm">
                  <CardContent className="py-3 px-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="text-center">
                        <p className="text-sm font-semibold">{p.fromDesignation?.name}</p>
                        <p className="text-xs text-muted-foreground">L{p.fromDesignation?.level}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="text-center">
                        <p className="text-sm font-semibold">{p.toDesignation?.name}</p>
                        <p className="text-xs text-muted-foreground">L{p.toDesignation?.level}</p>
                      </div>
                      {p.typicalYears && (
                        <Badge variant="outline" className="text-xs ml-2">~{p.typicalYears} yrs</Badge>
                      )}
                    </div>
                    {isHR && (
                      <button className="text-muted-foreground hover:text-red-500 text-xs shrink-0"
                        onClick={() => deletePathMutation.mutate(p.id)}>
                        Remove
                      </button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <NewDesignationDialog open={showNewDesignation} onClose={() => setShowNewDesignation(false)} />
      <NewCareerPathDialog open={showNewPath} onClose={() => setShowNewPath(false)} designations={designations ?? []} />
    </div>
  );
}

function NewDesignationDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [level, setLevel] = useState('1');
  const [department, setDepartment] = useState('');
  const [skills, setSkills] = useState('');
  const create = useCreateDesignation();

  async function handleSubmit() {
    if (!name) return;
    await create.mutateAsync({ name, level: Number(level), department: department || undefined, skills: skills ? skills.split(',').map((s) => s.trim()).filter(Boolean) : [] });
    setName(''); setLevel('1'); setDepartment(''); setSkills('');
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>New Designation</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Title</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Level (1-20)</Label><Input type="number" min="1" max="20" value={level} onChange={(e) => setLevel(e.target.value)} /></div>
          <div><Label>Department (optional)</Label><Input value={department} onChange={(e) => setDepartment(e.target.value)} /></div>
          <div><Label>Skills (comma-separated)</Label><Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, Node.js, Leadership" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name || create.isPending}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewCareerPathDialog({ open, onClose, designations }: { open: boolean; onClose: () => void; designations: any[] }) {
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [typicalYears, setTypicalYears] = useState('');
  const [skills, setSkills] = useState('');
  const create = useCreateCareerPath();

  async function handleSubmit() {
    if (!fromId || !toId) return;
    await create.mutateAsync({ fromDesignationId: fromId, toDesignationId: toId, typicalYears: typicalYears ? Number(typicalYears) : undefined, skillsRequired: skills ? skills.split(',').map((s) => s.trim()).filter(Boolean) : [] });
    setFromId(''); setToId(''); setTypicalYears(''); setSkills('');
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>New Career Path</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>From Designation</Label>
            <select value={fromId} onChange={(e) => setFromId(e.target.value)} className="w-full border rounded-md p-2 text-sm mt-1">
              <option value="">Select...</option>
              {designations.map((d) => <option key={d.id} value={d.id}>L{d.level} — {d.name}</option>)}
            </select>
          </div>
          <div>
            <Label>To Designation</Label>
            <select value={toId} onChange={(e) => setToId(e.target.value)} className="w-full border rounded-md p-2 text-sm mt-1">
              <option value="">Select...</option>
              {designations.map((d) => <option key={d.id} value={d.id}>L{d.level} — {d.name}</option>)}
            </select>
          </div>
          <div><Label>Typical Years</Label><Input type="number" value={typicalYears} onChange={(e) => setTypicalYears(e.target.value)} /></div>
          <div><Label>Skills Required (comma-separated)</Label><Input value={skills} onChange={(e) => setSkills(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!fromId || !toId || create.isPending}>Create Path</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
