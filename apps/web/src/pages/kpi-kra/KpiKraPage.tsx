import { useState } from 'react';
import { useSessionStorageState } from '@/hooks/useSessionStorageState';
import {
  Target, Plus, ChevronDown, ChevronUp, Pencil, Trash2,
  TrendingUp, Users, CheckCircle2, AlertCircle, Clock, BarChart3,
  UserPlus, X,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { useEmployees } from '@/hooks/useEmployees';
import {
  useKRAs, useCreateKRA, useUpdateKRA, useDeleteKRA,
  useCreateKPI, useUpdateKPI, useDeleteKPI,
  useKRAAssignments, useAssignKRA, useUpdateAssignment, useDeleteAssignment,
  useUpdateKPIRecord, useKpiKraSummary,
  type KRA, type KPI, type KRAAssignment, type KPIUnit, type KPIFrequency, type KRAStatus, type KPIRecordStatus,
} from '@/hooks/useKpiKra';

// ── Helpers ──────────────────────────────────────────────────────────────────

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'];
const MANAGER_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'];

const UNIT_META: Record<KPIUnit, { label: string; suffix: string }> = {
  PERCENTAGE: { label: 'Percentage', suffix: '%' },
  NUMBER:     { label: 'Number',     suffix: '' },
  CURRENCY:   { label: 'Currency',   suffix: '₹' },
  BOOLEAN:    { label: 'Yes / No',   suffix: '' },
};

const FREQ_LABEL: Record<KPIFrequency, string> = {
  MONTHLY:   'Monthly',
  QUARTERLY: 'Quarterly',
  ANNUAL:    'Annual',
};

const STATUS_META: Record<KPIRecordStatus, { label: string; color: string; icon: React.ElementType }> = {
  NOT_STARTED: { label: 'Not Started', color: 'bg-gray-100 text-gray-600',   icon: Clock },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-100 text-blue-700',   icon: TrendingUp },
  ACHIEVED:    { label: 'Achieved',    color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  MISSED:      { label: 'Missed',      color: 'bg-red-100 text-red-600',     icon: AlertCircle },
  PARTIAL:     { label: 'Partial',     color: 'bg-amber-100 text-amber-700', icon: BarChart3 },
};

const KRA_STATUS_META: Record<KRAStatus, { label: string; color: string }> = {
  ACTIVE:    { label: 'Active',    color: 'bg-green-100 text-green-700' },
  COMPLETED: { label: 'Completed', color: 'bg-blue-100 text-blue-700' },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500' },
};

function formatValue(val: number | undefined | null, unit: KPIUnit) {
  if (val === undefined || val === null) return '—';
  if (unit === 'BOOLEAN') return val ? 'Yes' : 'No';
  if (unit === 'CURRENCY') return `₹${val.toLocaleString('en-IN')}`;
  if (unit === 'PERCENTAGE') return `${val}%`;
  return val.toString();
}

// ── KRA Library Tab ───────────────────────────────────────────────────────────

function KRALibraryTab() {
  const { data: kras = [], isLoading } = useKRAs();
  const createKRA = useCreateKRA();
  const updateKRA = useUpdateKRA();
  const deleteKRA = useDeleteKRA();
  const createKPI = useCreateKPI();
  const updateKPI = useUpdateKPI();
  const deleteKPI = useDeleteKPI();

  const [expanded, setExpanded] = useState<string | null>(null);
  const [kraDialog, setKraDialog] = useState<{ open: boolean; kra?: KRA }>({ open: false });
  const [kpiDialog, setKpiDialog] = useState<{ open: boolean; kraId?: string; kpi?: KPI }>({ open: false });
  const [kraForm, setKraForm] = useState({ name: '', description: '', department: '' });
  const [kpiForm, setKpiForm] = useState({ name: '', description: '', unit: 'NUMBER' as KPIUnit, targetValue: '', frequency: 'QUARTERLY' as KPIFrequency });

  function openKRACreate() {
    setKraForm({ name: '', description: '', department: '' });
    setKraDialog({ open: true });
  }
  function openKRAEdit(kra: KRA) {
    setKraForm({ name: kra.name, description: kra.description ?? '', department: kra.department ?? '' });
    setKraDialog({ open: true, kra });
  }
  function openKPICreate(kraId: string) {
    setKpiForm({ name: '', description: '', unit: 'NUMBER', targetValue: '', frequency: 'QUARTERLY' });
    setKpiDialog({ open: true, kraId });
  }
  function openKPIEdit(kraId: string, kpi: KPI) {
    setKpiForm({ name: kpi.name, description: kpi.description ?? '', unit: kpi.unit, targetValue: kpi.targetValue?.toString() ?? '', frequency: kpi.frequency });
    setKpiDialog({ open: true, kraId, kpi });
  }

  async function saveKRA() {
    try {
      if (kraDialog.kra) {
        await updateKRA.mutateAsync({ id: kraDialog.kra.id, ...kraForm });
        toast.success('KRA updated');
      } else {
        await createKRA.mutateAsync(kraForm);
        toast.success('KRA created');
      }
      setKraDialog({ open: false });
    } catch { toast.error('Failed to save KRA'); }
  }

  async function saveKPI() {
    try {
      const payload = {
        ...kpiForm,
        targetValue: kpiForm.targetValue ? parseFloat(kpiForm.targetValue) : undefined,
      };
      if (kpiDialog.kpi) {
        await updateKPI.mutateAsync({ id: kpiDialog.kpi.id, ...payload });
        toast.success('KPI updated');
      } else {
        await createKPI.mutateAsync({ kraId: kpiDialog.kraId!, ...payload });
        toast.success('KPI added');
      }
      setKpiDialog({ open: false });
    } catch { toast.error('Failed to save KPI'); }
  }

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={openKRACreate}>
          <Plus className="h-4 w-4 mr-2" />New KRA
        </Button>
      </div>

      {kras.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-16">
          <Target className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No KRAs defined yet. Create your first Key Result Area.</p>
        </CardContent></Card>
      ) : (
        kras.map((kra) => {
          const isOpen = expanded === kra.id;
          return (
            <Card key={kra.id} className="border shadow-sm">
              <CardContent className="pt-3 pb-3 px-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{kra.name}</p>
                      {kra.department && <Badge variant="outline" className="text-xs">{kra.department}</Badge>}
                    </div>
                    {kra.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{kra.description}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{kra.kpis.length} KPI{kra.kpis.length !== 1 ? 's' : ''} · {kra._count?.assignments ?? 0} assignments</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button className="text-muted-foreground hover:text-primary p-1" onClick={() => openKPICreate(kra.id)} title="Add KPI">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button className="text-muted-foreground hover:text-foreground p-1" onClick={() => openKRAEdit(kra)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button className="text-muted-foreground hover:text-red-500 p-1" onClick={() => deleteKRA.mutate(kra.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <button className="text-muted-foreground hover:text-foreground p-1" onClick={() => setExpanded(isOpen ? null : kra.id)}>
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-3 border-t pt-3 space-y-2">
                    {kra.kpis.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No KPIs added yet.</p>
                    ) : (
                      <div className="rounded-lg border overflow-hidden">
                        <table className="w-full text-xs">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground">KPI</th>
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground hidden sm:table-cell">Unit</th>
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground hidden sm:table-cell">Target</th>
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground hidden md:table-cell">Frequency</th>
                              <th className="px-3 py-2 w-16"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {kra.kpis.map((kpi) => (
                              <tr key={kpi.id} className="hover:bg-muted/20">
                                <td className="px-3 py-2">
                                  <p className="font-medium">{kpi.name}</p>
                                  {kpi.description && <p className="text-muted-foreground line-clamp-1">{kpi.description}</p>}
                                </td>
                                <td className="px-3 py-2 hidden sm:table-cell text-muted-foreground">{UNIT_META[kpi.unit].label}</td>
                                <td className="px-3 py-2 hidden sm:table-cell font-medium">
                                  {kpi.targetValue != null ? formatValue(kpi.targetValue, kpi.unit) : '—'}
                                </td>
                                <td className="px-3 py-2 hidden md:table-cell text-muted-foreground">{FREQ_LABEL[kpi.frequency]}</td>
                                <td className="px-3 py-2">
                                  <div className="flex items-center gap-1">
                                    <button className="text-muted-foreground hover:text-foreground" onClick={() => openKPIEdit(kra.id, kpi)}>
                                      <Pencil className="h-3 w-3" />
                                    </button>
                                    <button className="text-muted-foreground hover:text-red-500" onClick={() => deleteKPI.mutate(kpi.id)}>
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}

      {/* KRA Dialog */}
      <Dialog open={kraDialog.open} onOpenChange={(o) => !o && setKraDialog({ open: false })}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{kraDialog.kra ? 'Edit KRA' : 'New Key Result Area'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name *</Label>
              <Input value={kraForm.name} onChange={(e) => setKraForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Revenue Generation" />
            </div>
            <div><Label>Description</Label>
              <Textarea value={kraForm.description} onChange={(e) => setKraForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div><Label>Department / Role Group</Label>
              <Input value={kraForm.department} onChange={(e) => setKraForm((f) => ({ ...f, department: e.target.value }))} placeholder="e.g. Sales, Engineering" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKraDialog({ open: false })}>Cancel</Button>
            <Button onClick={saveKRA} disabled={!kraForm.name || createKRA.isPending || updateKRA.isPending}>
              {kraDialog.kra ? 'Save Changes' : 'Create KRA'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* KPI Dialog */}
      <Dialog open={kpiDialog.open} onOpenChange={(o) => !o && setKpiDialog({ open: false })}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{kpiDialog.kpi ? 'Edit KPI' : 'Add KPI'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>KPI Name *</Label>
              <Input value={kpiForm.name} onChange={(e) => setKpiForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Quarterly Sales Target" />
            </div>
            <div><Label>Description</Label>
              <Input value={kpiForm.description} onChange={(e) => setKpiForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Measurement Unit</Label>
                <Select value={kpiForm.unit} onValueChange={(v) => setKpiForm((f) => ({ ...f, unit: v as KPIUnit }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(UNIT_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Frequency</Label>
                <Select value={kpiForm.frequency} onValueChange={(v) => setKpiForm((f) => ({ ...f, frequency: v as KPIFrequency }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(FREQ_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Default Target Value</Label>
              <Input type="number" value={kpiForm.targetValue} onChange={(e) => setKpiForm((f) => ({ ...f, targetValue: e.target.value }))}
                placeholder={kpiForm.unit === 'PERCENTAGE' ? 'e.g. 95' : kpiForm.unit === 'CURRENCY' ? 'e.g. 5000000' : 'e.g. 100'} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKpiDialog({ open: false })}>Cancel</Button>
            <Button onClick={saveKPI} disabled={!kpiForm.name || createKPI.isPending || updateKPI.isPending}>
              {kpiDialog.kpi ? 'Save Changes' : 'Add KPI'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Assignments Tab ───────────────────────────────────────────────────────────

function AssignmentsTab({ isManager }: { isManager: boolean }) {
  const { data: kras = [] } = useKRAs();
  const { data: employeesData } = useEmployees({ limit: 200 });
  const [filterEmp, setFilterEmp] = useState('__all__');
  const [filterPeriod, setFilterPeriod] = useState('');
  const { data: assignments = [], isLoading } = useKRAAssignments(
    filterEmp !== '__all__' ? filterEmp : undefined,
    filterPeriod || undefined,
  );
  const assignKRA = useAssignKRA();
  const updateAsgn = useUpdateAssignment();
  const deleteAsgn = useDeleteAssignment();
  const updateRecord = useUpdateKPIRecord();

  const [expanded, setExpanded] = useState<string | null>(null);
  const [assignDialog, setAssignDialog] = useState(false);
  const [assignForm, setAssignForm] = useState({ employeeId: '', kraId: '', period: '' });

  async function handleAssign() {
    try {
      await assignKRA.mutateAsync(assignForm);
      toast.success('KRA assigned successfully');
      setAssignDialog(false);
    } catch { toast.error('Failed to assign KRA'); }
  }

  const periods = [...new Set(assignments.map((a) => a.period))].sort().reverse();

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {isManager && (
            <Select value={filterEmp} onValueChange={setFilterEmp}>
              <SelectTrigger className="w-48 h-8 text-sm"><SelectValue placeholder="All employees" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Employees</SelectItem>
                {(employeesData?.employees ?? []).map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Input
            className="h-8 text-sm w-32"
            placeholder="Period (e.g. Q1-2026)"
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
          />
        </div>
        {isManager && (
          <Button size="sm" onClick={() => setAssignDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />Assign KRA
          </Button>
        )}
      </div>

      {assignments.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-16">
          <Users className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No assignments found.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {assignments.map((asgn) => {
            const isOpen = expanded === asgn.id;
            const statusMeta = KRA_STATUS_META[asgn.status];
            const score = asgn.overallScore;
            return (
              <Card key={asgn.id} className="border shadow-sm">
                <CardContent className="pt-3 pb-3 px-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{asgn.kra.name}</p>
                        <Badge variant="outline" className={cn('text-xs', statusMeta.color)}>{statusMeta.label}</Badge>
                        <Badge variant="outline" className="text-xs bg-muted">{asgn.period}</Badge>
                      </div>
                      {isManager && asgn.employee && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {asgn.employee.firstName} {asgn.employee.lastName} · {asgn.employee.employeeCode}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5">
                        {score != null ? (
                          <>
                            <div className="flex-1 max-w-32">
                              <Progress value={Math.min(score, 100)} className="h-1.5" />
                            </div>
                            <span className={cn('text-xs font-semibold tabular-nums', score >= 80 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-600')}>
                              {score}%
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">{asgn.kpiRecords.length} KPIs</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {isManager && (
                        <>
                          <Select value={asgn.status} onValueChange={(v) => updateAsgn.mutate({ id: asgn.id, status: v as KRAStatus })}>
                            <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ACTIVE">Active</SelectItem>
                              <SelectItem value="COMPLETED">Completed</SelectItem>
                              <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <button className="text-muted-foreground hover:text-red-500 p-1" onClick={() => deleteAsgn.mutate(asgn.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                      <button className="text-muted-foreground hover:text-foreground p-1" onClick={() => setExpanded(isOpen ? null : asgn.id)}>
                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-3 border-t pt-3 space-y-2">
                      {asgn.kpiRecords.map((rec) => {
                        const sm = STATUS_META[rec.status];
                        const Icon = sm.icon;
                        const isEditable = !isManager ? asgn.status === 'ACTIVE' : true;
                        return (
                          <div key={rec.id} className="rounded-lg border p-3 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="text-sm font-medium">{rec.kpi.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {UNIT_META[rec.kpi.unit].label} · {FREQ_LABEL[rec.kpi.frequency]}
                                  {rec.targetValue != null && ` · Target: ${formatValue(rec.targetValue, rec.kpi.unit)}`}
                                </p>
                              </div>
                              <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium shrink-0', sm.color)}>
                                <Icon className="h-3 w-3" />{sm.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                {rec.achievementPct != null && (
                                  <Progress value={Math.min(rec.achievementPct, 100)} className="h-1.5" />
                                )}
                              </div>
                              <span className="text-xs font-semibold tabular-nums w-10 text-right">
                                {rec.actualValue != null ? formatValue(rec.actualValue, rec.kpi.unit) : '—'}
                              </span>
                              {rec.achievementPct != null && (
                                <span className={cn('text-xs font-bold tabular-nums w-10 text-right', rec.achievementPct >= 100 ? 'text-green-600' : rec.achievementPct >= 70 ? 'text-amber-600' : 'text-red-600')}>
                                  {rec.achievementPct}%
                                </span>
                              )}
                            </div>
                            {isEditable && rec.kpi.unit !== 'BOOLEAN' && (
                              <div className="flex items-center gap-2 mt-1">
                                <Input
                                  type="number"
                                  className="h-7 text-xs w-28"
                                  placeholder="Actual value"
                                  defaultValue={rec.actualValue ?? ''}
                                  onBlur={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (!isNaN(val)) {
                                      updateRecord.mutate({ id: rec.id, actualValue: val });
                                    }
                                  }}
                                />
                                <Select
                                  value={rec.status}
                                  onValueChange={(v) => updateRecord.mutate({ id: rec.id, status: v as KPIRecordStatus })}
                                >
                                  <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(STATUS_META).map(([k, v]) => (
                                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Assign Dialog */}
      <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Assign KRA to Employee</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Employee *</Label>
              <Select value={assignForm.employeeId} onValueChange={(v) => setAssignForm((f) => ({ ...f, employeeId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {(employeesData?.employees ?? []).map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeCode})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>KRA *</Label>
              <Select value={assignForm.kraId} onValueChange={(v) => setAssignForm((f) => ({ ...f, kraId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select KRA" /></SelectTrigger>
                <SelectContent>
                  {kras.map((k) => <SelectItem key={k.id} value={k.id}>{k.name} ({k.kpis.length} KPIs)</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Period *</Label>
              <Input value={assignForm.period} onChange={(e) => setAssignForm((f) => ({ ...f, period: e.target.value }))} placeholder="e.g. Q1-2026, FY-2026" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={!assignForm.employeeId || !assignForm.kraId || !assignForm.period || assignKRA.isPending}>
              Assign KRA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function KpiKraPage() {
  const user = useAuthStore((s) => s.user);
  const isHR = HR_ROLES.includes(user?.role ?? '');
  const isManager = MANAGER_ROLES.includes(user?.role ?? '');
  const [activeTab, setActiveTab] = useSessionStorageState<string>('kpi_kra_tab', isHR ? 'library' : 'assignments');
  const { data: summary } = useKpiKraSummary();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
            <Target className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">KPI / KRA</h1>
            <p className="text-sm text-muted-foreground">Key Result Areas & Key Performance Indicators</p>
          </div>
        </div>
      </div>

      {/* Summary chips */}
      {summary && (
        <div className="flex flex-wrap gap-4">
          {[
            { label: 'KRAs Defined', value: summary.totalKRAs, color: 'text-violet-600' },
            { label: 'Total Assignments', value: summary.totalAssignments, color: 'text-blue-600' },
            { label: 'Active', value: summary.activeAssignments, color: 'text-green-600' },
            { label: 'Completed', value: summary.completedAssignments, color: 'text-gray-500' },
          ].map(({ label, value, color }, i, arr) => (
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
        <TabsList>
          {isHR && <TabsTrigger value="library" className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5" />KRA Library</TabsTrigger>}
          <TabsTrigger value="assignments" className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{isManager ? 'Assignments' : 'My KPIs'}</TabsTrigger>
        </TabsList>
        <div className="mt-4">
          {isHR && <TabsContent value="library"><KRALibraryTab /></TabsContent>}
          <TabsContent value="assignments"><AssignmentsTab isManager={isManager} /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
