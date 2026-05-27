import { useState } from 'react';
import { useSessionStorageState } from '@/hooks/useSessionStorageState';
import {
  Layers, Plus, Pencil, Trash2, Search, Shield, ShieldCheck,
  Code2, Brain, Globe, Award, Wrench, BookOpen,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import {
  useSkills, useCreateSkill, useUpdateSkill, useDeleteSkill,
  useMySkills, useAddMySkill, useDeleteMySkill,
  useSkillsMatrix, useSearchBySkill, useVerifySkill, useSkillsSummary,
  type Skill, type SkillCategory, type SkillProficiency, type MatrixRow,
} from '@/hooks/useSkills';

// ── Constants ─────────────────────────────────────────────────────────────────

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'];
const MANAGER_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'];

const CATEGORY_META: Record<SkillCategory, { label: string; icon: React.ElementType; color: string }> = {
  TECHNICAL:     { label: 'Technical',     icon: Code2,     color: 'text-blue-500' },
  SOFT_SKILL:    { label: 'Soft Skill',    icon: Brain,     color: 'text-purple-500' },
  DOMAIN:        { label: 'Domain',        icon: BookOpen,  color: 'text-orange-500' },
  CERTIFICATION: { label: 'Certification', icon: Award,     color: 'text-yellow-500' },
  LANGUAGE:      { label: 'Language',      icon: Globe,     color: 'text-green-500' },
  TOOL:          { label: 'Tool',          icon: Wrench,    color: 'text-gray-500' },
};

const PROFICIENCY_META: Record<SkillProficiency, { label: string; color: string; bars: number }> = {
  BEGINNER:     { label: 'Beginner',     color: 'bg-gray-200 text-gray-700',    bars: 1 },
  INTERMEDIATE: { label: 'Intermediate', color: 'bg-blue-100 text-blue-700',    bars: 2 },
  ADVANCED:     { label: 'Advanced',     color: 'bg-violet-100 text-violet-700', bars: 3 },
  EXPERT:       { label: 'Expert',       color: 'bg-green-100 text-green-700',  bars: 4 },
};

function ProficiencyBars({ level, compact = false }: { level: SkillProficiency; compact?: boolean }) {
  const { bars } = PROFICIENCY_META[level];
  return (
    <div className={cn('flex items-end gap-0.5', compact ? 'h-3' : 'h-4')}>
      {[1, 2, 3, 4].map((b) => (
        <div
          key={b}
          className={cn(
            'rounded-sm transition-colors',
            compact ? 'w-1' : 'w-1.5',
            b <= bars
              ? b === 4 ? 'bg-green-500' : b === 3 ? 'bg-violet-500' : b === 2 ? 'bg-blue-500' : 'bg-gray-400'
              : 'bg-muted',
          )}
          style={{ height: compact ? `${b * 25}%` : `${b * 25}%` }}
        />
      ))}
    </div>
  );
}

function initials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
}

// ── Skill Catalog Tab ─────────────────────────────────────────────────────────

function SkillCatalogTab() {
  const { data: skills = [], isLoading } = useSkills();
  const createSkill = useCreateSkill();
  const updateSkill = useUpdateSkill();
  const deleteSkill = useDeleteSkill();

  const [dialog, setDialog] = useState<{ open: boolean; skill?: Skill }>({ open: false });
  const [form, setForm] = useState({ name: '', category: 'TECHNICAL' as SkillCategory, description: '' });
  const [search, setSearch] = useState('');

  function openCreate() {
    setForm({ name: '', category: 'TECHNICAL', description: '' });
    setDialog({ open: true });
  }
  function openEdit(skill: Skill) {
    setForm({ name: skill.name, category: skill.category, description: skill.description ?? '' });
    setDialog({ open: true, skill });
  }

  async function save() {
    try {
      if (dialog.skill) {
        await updateSkill.mutateAsync({ id: dialog.skill.id, ...form });
        toast.success('Skill updated');
      } else {
        await createSkill.mutateAsync(form);
        toast.success('Skill created');
      }
      setDialog({ open: false });
    } catch { toast.error('Failed to save skill'); }
  }

  const filtered = skills.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
    CATEGORY_META[s.category].label.toLowerCase().includes(search.toLowerCase()),
  );

  // Group by category
  const grouped = filtered.reduce<Record<string, Skill[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  if (isLoading) return <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input className="pl-9 h-8 text-sm" placeholder="Search skills..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-2" />New Skill</Button>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-16">
          <Layers className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No skills in the catalog yet.</p>
        </CardContent></Card>
      ) : (
        Object.entries(grouped).map(([cat, catSkills]) => {
          const meta = CATEGORY_META[cat as SkillCategory];
          const Icon = meta.icon;
          return (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className={cn('h-4 w-4', meta.color)} />
                <p className="text-sm font-semibold">{meta.label}</p>
                <span className="text-xs text-muted-foreground">({catSkills.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {catSkills.map((skill) => (
                  <div key={skill.id} className="flex items-center justify-between rounded-lg border px-3 py-2 bg-card hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className={cn('h-3.5 w-3.5 shrink-0', meta.color)} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{skill.name}</p>
                        {skill._count && <p className="text-xs text-muted-foreground">{skill._count.employeeSkills} employees</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button className="text-muted-foreground hover:text-foreground p-1" onClick={() => openEdit(skill)}>
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button className="text-muted-foreground hover:text-red-500 p-1" onClick={() => deleteSkill.mutate(skill.id)}>
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      <Dialog open={dialog.open} onOpenChange={(o) => !o && setDialog({ open: false })}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{dialog.skill ? 'Edit Skill' : 'New Skill'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Skill Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. React.js, Leadership, SQL" />
            </div>
            <div><Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as SkillCategory }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_META).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ open: false })}>Cancel</Button>
            <Button onClick={save} disabled={!form.name || createSkill.isPending || updateSkill.isPending}>
              {dialog.skill ? 'Save Changes' : 'Create Skill'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── My Skills Tab ─────────────────────────────────────────────────────────────

function MySkillsTab() {
  const { data: mySkills = [], isLoading } = useMySkills();
  const { data: catalog = [] } = useSkills();
  const addSkill = useAddMySkill();
  const deleteSkill = useDeleteMySkill();

  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState({
    skillId: '',
    proficiency: 'BEGINNER' as SkillProficiency,
    yearsOfExperience: '',
    lastUsedYear: '',
    certificationUrl: '',
    notes: '',
  });

  const mySkillIds = new Set(mySkills.map((s) => s.skillId));
  const available = catalog.filter((s) => !mySkillIds.has(s.id));

  async function save() {
    try {
      await addSkill.mutateAsync({
        ...form,
        yearsOfExperience: form.yearsOfExperience ? parseFloat(form.yearsOfExperience) : undefined,
        lastUsedYear: form.lastUsedYear ? parseInt(form.lastUsedYear) : undefined,
        certificationUrl: form.certificationUrl || undefined,
        notes: form.notes || undefined,
      });
      toast.success('Skill added to your profile');
      setDialog(false);
    } catch { toast.error('Failed to add skill'); }
  }

  // Group by category
  const grouped = mySkills.reduce<Record<string, typeof mySkills>>((acc, s) => {
    const cat = s.skill.category;
    (acc[cat] ??= []).push(s);
    return acc;
  }, {});

  if (isLoading) return <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDialog(true)} disabled={available.length === 0}>
          <Plus className="h-4 w-4 mr-2" />Add Skill
        </Button>
      </div>

      {mySkills.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-16">
          <Layers className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm font-medium">No skills added yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add skills to your profile so managers can find you for projects.</p>
        </CardContent></Card>
      ) : (
        Object.entries(grouped).map(([cat, catSkills]) => {
          const meta = CATEGORY_META[cat as SkillCategory];
          const Icon = meta.icon;
          return (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className={cn('h-4 w-4', meta.color)} />
                <p className="text-sm font-semibold">{meta.label}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {catSkills.map((es) => {
                  const pm = PROFICIENCY_META[es.proficiency];
                  return (
                    <div key={es.id} className="flex items-center justify-between rounded-lg border px-3 py-2.5 bg-card">
                      <div className="flex items-center gap-3">
                        <ProficiencyBars level={es.proficiency} />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium">{es.skill.name}</p>
                            {es.isVerified && <ShieldCheck className="h-3.5 w-3.5 text-green-500" title="Verified" />}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={cn('inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold', pm.color)}>{pm.label}</span>
                            {es.yearsOfExperience && <span className="text-xs text-muted-foreground">{es.yearsOfExperience}y exp</span>}
                          </div>
                        </div>
                      </div>
                      <button className="text-muted-foreground hover:text-red-500 p-1" onClick={() => deleteSkill.mutate(es.skillId)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Skill to Profile</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Skill *</Label>
              <Select value={form.skillId} onValueChange={(v) => setForm((f) => ({ ...f, skillId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select a skill" /></SelectTrigger>
                <SelectContent>
                  {available.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="flex items-center gap-2">
                        <span className={cn('text-xs font-medium', CATEGORY_META[s.category].color)}>{CATEGORY_META[s.category].label}</span>
                        <span>{s.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Proficiency Level</Label>
              <Select value={form.proficiency} onValueChange={(v) => setForm((f) => ({ ...f, proficiency: v as SkillProficiency }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PROFICIENCY_META).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Years of Experience</Label>
                <Input type="number" min="0" max="50" step="0.5" value={form.yearsOfExperience} onChange={(e) => setForm((f) => ({ ...f, yearsOfExperience: e.target.value }))} placeholder="e.g. 3" />
              </div>
              <div><Label>Last Used Year</Label>
                <Input type="number" min="2000" max={new Date().getFullYear()} value={form.lastUsedYear} onChange={(e) => setForm((f) => ({ ...f, lastUsedYear: e.target.value }))} placeholder={new Date().getFullYear().toString()} />
              </div>
            </div>
            <div><Label>Certification URL</Label>
              <Input value={form.certificationUrl} onChange={(e) => setForm((f) => ({ ...f, certificationUrl: e.target.value }))} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={!form.skillId || addSkill.isPending}>Add Skill</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Matrix View Tab ───────────────────────────────────────────────────────────

function MatrixViewTab() {
  const { data: catalog = [] } = useSkills();
  const [filterCategory, setFilterCategory] = useState('__all__');
  const [filterSkill, setFilterSkill] = useState('__all__');
  const [search, setSearch] = useState('');
  const verifySkill = useVerifySkill();

  const { data: matrix = [], isLoading } = useSkillsMatrix({
    skillId: filterSkill !== '__all__' ? filterSkill : undefined,
    category: filterCategory !== '__all__' ? filterCategory : undefined,
    search: search || undefined,
  });

  // All unique skills appearing in the matrix (for column headers)
  const allSkillIds = [...new Set(matrix.flatMap((r) => r.skills.map((s) => s.skillId)))];
  const skillMap = new Map(catalog.map((s) => [s.id, s]));
  const displayedSkills = allSkillIds.slice(0, 12); // cap columns for readability

  if (isLoading) return <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 max-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input className="pl-9 h-8 text-sm" placeholder="Search employee..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40 h-8 text-sm"><SelectValue placeholder="All categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Categories</SelectItem>
            {Object.entries(CATEGORY_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterSkill} onValueChange={setFilterSkill}>
          <SelectTrigger className="w-48 h-8 text-sm"><SelectValue placeholder="All skills" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Skills</SelectItem>
            {catalog.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {matrix.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-16">
          <Layers className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No skill data found. Employees need to add skills to their profiles.</p>
        </CardContent></Card>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-max">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground sticky left-0 bg-muted/50 min-w-48">Employee</th>
                  {displayedSkills.map((sid) => {
                    const sk = skillMap.get(sid);
                    const meta = sk ? CATEGORY_META[sk.category] : null;
                    const Icon = meta?.icon;
                    return (
                      <th key={sid} className="px-2 py-3 text-center font-medium text-muted-foreground min-w-28">
                        <div className="flex flex-col items-center gap-0.5">
                          {Icon && <Icon className={cn('h-3.5 w-3.5', meta?.color)} />}
                          <span className="text-xs leading-tight">{sk?.name ?? sid.slice(0, 8)}</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y">
                {matrix.map((row) => (
                  <tr key={row.employee.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 sticky left-0 bg-background border-r">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarImage src={row.employee.avatarUrl ?? undefined} />
                          <AvatarFallback className="text-xs">{initials(row.employee.firstName, row.employee.lastName)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{row.employee.firstName} {row.employee.lastName}</p>
                          <p className="text-xs text-muted-foreground">{row.employee.department?.name ?? row.employee.designation ?? ''}</p>
                        </div>
                      </div>
                    </td>
                    {displayedSkills.map((sid) => {
                      const empSkill = row.skills.find((s) => s.skillId === sid);
                      if (!empSkill) return <td key={sid} className="px-2 py-2.5 text-center"><span className="text-muted-foreground/30">—</span></td>;
                      const pm = PROFICIENCY_META[empSkill.proficiency];
                      return (
                        <td key={sid} className="px-2 py-2.5 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1">
                              <ProficiencyBars level={empSkill.proficiency} compact />
                              {empSkill.isVerified
                                ? <ShieldCheck className="h-3 w-3 text-green-500" />
                                : <button className="text-muted-foreground/50 hover:text-blue-500 transition-colors" title="Click to verify" onClick={() => verifySkill.mutate({ employeeId: row.employee.id, skillId: sid })}>
                                    <Shield className="h-3 w-3" />
                                  </button>
                              }
                            </div>
                            <span className={cn('text-[10px] font-medium px-1 rounded-sm', pm.color)}>{pm.label.slice(0, 3)}</span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {allSkillIds.length > 12 && (
            <p className="text-xs text-muted-foreground text-center py-2 border-t">Showing 12 of {allSkillIds.length} skills. Use filters to narrow down.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Find by Skill Tab ─────────────────────────────────────────────────────────

function FindBySkillTab() {
  const { data: catalog = [] } = useSkills();
  const [selectedSkill, setSelectedSkill] = useState('__none__');
  const [proficiency, setProficiency] = useState('__all__');

  const { data: results = [], isLoading } = useSearchBySkill(
    selectedSkill !== '__none__' ? selectedSkill : null,
    proficiency !== '__all__' ? proficiency : undefined,
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-muted/20 px-4 py-3">
        <p className="text-sm font-medium mb-3 flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          Find employees who have a specific skill
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedSkill} onValueChange={setSelectedSkill}>
            <SelectTrigger className="flex-1"><SelectValue placeholder="Select a skill..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— Select skill —</SelectItem>
              {catalog.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <span className="flex items-center gap-2">
                    <span className={cn('text-xs', CATEGORY_META[s.category].color)}>{CATEGORY_META[s.category].label}</span>
                    <span>{s.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={proficiency} onValueChange={setProficiency}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Any proficiency" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Any Proficiency</SelectItem>
              {Object.entries(PROFICIENCY_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}+</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedSkill === '__none__' ? (
        <div className="flex flex-col items-center py-12 text-center">
          <Search className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Select a skill above to find matching employees.</p>
        </div>
      ) : isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : results.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-12">
          <p className="text-sm text-muted-foreground">No employees found with this skill.</p>
        </CardContent></Card>
      ) : (
        <div>
          <p className="text-sm text-muted-foreground mb-2">{results.length} employee{results.length !== 1 ? 's' : ''} found</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {results.map((es) => {
              const pm = PROFICIENCY_META[es.proficiency];
              return (
                <Card key={es.id} className="border shadow-sm">
                  <CardContent className="pt-3 pb-3 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage src={es.employee?.avatarUrl ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {es.employee ? initials(es.employee.firstName, es.employee.lastName) : '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {es.employee?.firstName} {es.employee?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{es.employee?.designation ?? es.employee?.department?.name ?? ''}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <ProficiencyBars level={es.proficiency} />
                        <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', pm.color)}>{pm.label}</span>
                      </div>
                    </div>
                    {es.yearsOfExperience && (
                      <p className="text-xs text-muted-foreground mt-2">{es.yearsOfExperience} yrs experience</p>
                    )}
                    {es.isVerified && (
                      <div className="flex items-center gap-1 mt-1">
                        <ShieldCheck className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-600 font-medium">Verified</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SkillsMatrixPage() {
  const user = useAuthStore((s) => s.user);
  const isHR = HR_ROLES.includes(user?.role ?? '');
  const isManager = MANAGER_ROLES.includes(user?.role ?? '');
  const [activeTab, setActiveTab] = useSessionStorageState<string>('skills_matrix_tab', 'my-skills');
  const { data: summary } = useSkillsSummary();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
          <Layers className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Skills Matrix</h1>
          <p className="text-sm text-muted-foreground">Org-wide skill inventory &amp; employee capability map</p>
        </div>
      </div>

      {/* Summary chips */}
      {summary && (
        <div className="flex flex-wrap gap-4">
          {[
            { label: 'Skills in Catalog', value: summary.totalSkills, color: 'text-emerald-600' },
            { label: 'Skills Tagged', value: summary.totalTagged, color: 'text-blue-600' },
            { label: 'Verified', value: summary.verifiedCount, color: 'text-green-600' },
          ].map(({ label, value, color }, i) => (
            <div key={label} className="flex items-center">
              {i > 0 && <div className="mr-4 h-6 w-px bg-border/50" />}
              <div className="flex flex-col items-center gap-0.5">
                <span className={cn('text-xl font-bold leading-none tabular-nums', color)}>{value}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-none">{label}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="my-skills">My Skills</TabsTrigger>
          {isManager && <TabsTrigger value="matrix">Matrix View</TabsTrigger>}
          {isManager && <TabsTrigger value="find">Find by Skill</TabsTrigger>}
          {isHR && <TabsTrigger value="catalog">Skill Catalog</TabsTrigger>}
        </TabsList>
        <div className="mt-4">
          <TabsContent value="my-skills"><MySkillsTab /></TabsContent>
          {isManager && <TabsContent value="matrix"><MatrixViewTab /></TabsContent>}
          {isManager && <TabsContent value="find"><FindBySkillTab /></TabsContent>}
          {isHR && <TabsContent value="catalog"><SkillCatalogTab /></TabsContent>}
        </div>
      </Tabs>
    </div>
  );
}
