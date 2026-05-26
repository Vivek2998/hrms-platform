import { useState, useMemo, useCallback } from 'react';
import {
  ChevronDown, Network, Printer, Users, Building2, RefreshCw,
  Plus, ZoomIn, ZoomOut, Maximize2, UserPlus, AlertCircle,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useOrgChart } from '@/hooks/useDirectory';
import type { OrgChartEmployee } from '@/hooks/useDirectory';
import {
  useDesignationsWithEmployees, useOrgSettings, useUpdateOrgSettings,
  useSeedDesignations, useAssignEmployeeToDesignation,
  type DesignationWithEmployees,
} from '@/hooks/useDesignations';
import { useEmployees } from '@/hooks/useEmployees';
import { useAuthStore } from '@/stores/auth.store';
import { INDUSTRY_LABELS } from '@/lib/industry-templates';
import type { IndustryType } from '@/lib/industry-templates';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function initials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
}

// ─────────────────────────────────────────────────────────────
// ZOOM CONTROLS
// ─────────────────────────────────────────────────────────────

function ZoomControls({ zoom, onZoom }: { zoom: number; onZoom: (v: number) => void }) {
  return (
    <div className="no-print absolute right-3 top-3 z-10 flex items-center gap-1 rounded-lg border bg-background/95 px-2 py-1 shadow-sm backdrop-blur-sm">
      <button
        type="button"
        onClick={() => onZoom(Math.max(0.3, zoom - 0.15))}
        className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        title="Zoom out"
      >
        <ZoomOut className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onZoom(1)}
        className="min-w-10 text-center text-xs font-mono text-muted-foreground hover:text-foreground"
        title="Reset zoom"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        type="button"
        onClick={() => onZoom(Math.min(2, zoom + 0.15))}
        className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        title="Zoom in"
      >
        <ZoomIn className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onZoom(0.65)}
        className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        title="Fit to screen"
      >
        <Maximize2 className="h-3 w-3" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// REPORTING LINE CHART (managerId-based)
// ─────────────────────────────────────────────────────────────

interface TreeNode extends OrgChartEmployee {
  children: TreeNode[];
}

function buildTree(employees: OrgChartEmployee[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  employees.forEach((e) => map.set(e.id, { ...e, children: [] }));
  const roots: TreeNode[] = [];
  map.forEach((node) => {
    if (node.managerId && map.has(node.managerId)) {
      map.get(node.managerId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

function ReportingNode({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [open, setOpen] = useState(depth < 2);
  const hasKids = node.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          'relative w-44 rounded-xl border bg-card p-3 text-center shadow-sm transition-shadow print:border-gray-300 print:shadow-none',
          hasKids && 'cursor-pointer hover:shadow-md',
        )}
        onClick={() => { if (hasKids) setOpen((v) => !v); }}
      >
        <Avatar className="mx-auto h-10 w-10">
          <AvatarImage src={node.avatarUrl ?? undefined} />
          <AvatarFallback className="bg-primary/10 text-xs text-primary">
            {initials(node.firstName, node.lastName)}
          </AvatarFallback>
        </Avatar>
        <p className="mt-2 truncate text-sm font-semibold">{node.firstName} {node.lastName}</p>
        <p className="truncate text-xs text-muted-foreground">{node.designation ?? '—'}</p>
        {node.department && (
          <p className="mt-0.5 truncate text-[10px] text-muted-foreground/60">{node.department.name}</p>
        )}
        {hasKids && (
          <ChevronDown className={cn('absolute bottom-1.5 right-1.5 h-3 w-3 text-muted-foreground transition-transform', !open && '-rotate-90')} />
        )}
      </div>
      {hasKids && open && (
        <>
          <div className="h-5 w-px bg-border" />
          <div className="flex">
            {node.children.map((child, i) => (
              <div
                key={child.id}
                className={cn(
                  'flex flex-col items-center px-4',
                  node.children.length > 1 && 'border-t border-border',
                  i === 0 && node.children.length > 1 && 'rounded-tl-md border-l',
                  i === node.children.length - 1 && node.children.length > 1 && 'rounded-tr-md border-r',
                )}
              >
                <div className="h-5 w-px bg-border" />
                <ReportingNode node={child} depth={depth + 1} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ASSIGN EMPLOYEE DIALOG
// ─────────────────────────────────────────────────────────────

function AssignEmployeeDialog({
  open, positionName, designationId, onClose,
}: {
  open: boolean;
  positionName: string;
  designationId: string;
  onClose: () => void;
}) {
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const { data: employeesData } = useEmployees({ limit: 300 });
  const { mutateAsync: assign, isPending } = useAssignEmployeeToDesignation();

  async function handleAssign() {
    if (!selectedEmpId) return;
    try {
      await assign({ employeeId: selectedEmpId, designationId });
      toast.success('Employee assigned to position');
      setSelectedEmpId('');
      onClose();
    } catch {
      toast.error('Failed to assign employee');
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setSelectedEmpId(''); onClose(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Employee to "{positionName}"</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Select an employee to fill this position. Their profile will be updated automatically.
          </p>
          <Select value={selectedEmpId} onValueChange={setSelectedEmpId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an employee..." />
            </SelectTrigger>
            <SelectContent>
              {(employeesData?.employees ?? [])
                .filter((e) => e.status === 'ACTIVE')
                .map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.firstName} {e.lastName} ({e.employeeCode})
                    {e.designation ? ` — ${e.designation}` : ''}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!selectedEmpId || isPending} onClick={handleAssign}>
            {isPending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// POSITION NODE
// ─────────────────────────────────────────────────────────────

interface PositionNode extends DesignationWithEmployees {
  children: PositionNode[];
}

function buildPositionTree(designations: DesignationWithEmployees[]): PositionNode[] {
  const map = new Map<string, PositionNode>();
  designations.forEach((d) => map.set(d.id, { ...d, children: [] }));
  const roots: PositionNode[] = [];
  map.forEach((node) => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  const sort = (nodes: PositionNode[]) => {
    nodes.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
    nodes.forEach((n) => sort(n.children));
  };
  sort(roots);
  return roots;
}

function pruneVacant(nodes: PositionNode[]): PositionNode[] {
  return nodes
    .map((node) => ({ ...node, children: pruneVacant(node.children) }))
    .filter((node) => node.employees.length > 0 || node.children.length > 0);
}

function PositionNodeCard({
  node, depth = 0, printMode = false,
}: {
  node: PositionNode;
  depth?: number;
  printMode?: boolean;
}) {
  const [open, setOpen] = useState(depth < 3);
  const [assignOpen, setAssignOpen] = useState(false);
  const hasKids = node.children.length > 0;
  const isEmpty = node.employees.length === 0;

  if (printMode && isEmpty && node.children.length === 0) return null;

  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          'relative w-48 rounded-xl border bg-card text-center shadow-sm transition-shadow print:border-gray-300 print:shadow-none',
          isEmpty
            ? 'border-dashed border-muted-foreground/30 bg-muted/10'
            : 'border-solid',
          hasKids && !printMode && 'cursor-pointer hover:shadow-md',
        )}
        onClick={() => { if (hasKids && !printMode) setOpen((v) => !v); }}
      >
        {node.department && (
          <div className="px-3 pt-2">
            <span className="inline-flex max-w-full truncate rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary/80">
              {node.department}
            </span>
          </div>
        )}

        <div className="px-3 pb-3 pt-1.5">
          {isEmpty ? (
            <>
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                <Users className="h-4 w-4 text-muted-foreground/50" />
              </div>
              <p className="mt-2 text-sm font-semibold text-foreground">{node.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Vacant</p>
              {!printMode && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 h-6 w-full gap-1 text-xs"
                  onClick={(e) => { e.stopPropagation(); setAssignOpen(true); }}
                >
                  <Plus className="h-3 w-3" />Assign
                </Button>
              )}
            </>
          ) : (
            <>
              {node.employees.map((emp) => (
                <div key={emp.id} className="mt-1 first:mt-0">
                  <Avatar className="mx-auto h-9 w-9">
                    <AvatarImage src={emp.avatarUrl ?? undefined} />
                    <AvatarFallback className="bg-primary/10 text-xs text-primary">
                      {initials(emp.firstName, emp.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="mt-1.5 truncate text-sm font-semibold">
                    {emp.firstName} {emp.lastName}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{emp.employeeCode}</p>
                </div>
              ))}
              <p className="mt-1 text-xs font-medium text-foreground/80">{node.name}</p>
              {/* Allow manual reassignment even for filled positions */}
              {!printMode && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-1 h-5 w-full gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                  onClick={(e) => { e.stopPropagation(); setAssignOpen(true); }}
                >
                  <UserPlus className="h-2.5 w-2.5" />Change
                </Button>
              )}
            </>
          )}
        </div>

        {hasKids && !printMode && (
          <ChevronDown
            className={cn(
              'absolute bottom-1.5 right-1.5 h-3 w-3 text-muted-foreground transition-transform',
              !open && '-rotate-90',
            )}
          />
        )}
      </div>

      {hasKids && (open || printMode) && (
        <>
          <div className="h-5 w-px bg-border" />
          <div className="flex flex-wrap justify-center">
            {node.children
              .filter((child) => !printMode || child.employees.length > 0 || child.children.length > 0)
              .map((child, i, arr) => (
                <div
                  key={child.id}
                  className={cn(
                    'flex flex-col items-center px-3',
                    arr.length > 1 && 'border-t border-border',
                    i === 0 && arr.length > 1 && 'rounded-tl-md border-l',
                    i === arr.length - 1 && arr.length > 1 && 'rounded-tr-md border-r',
                  )}
                >
                  <div className="h-5 w-px bg-border" />
                  <PositionNodeCard node={child} depth={depth + 1} printMode={printMode} />
                </div>
              ))}
          </div>
        </>
      )}

      <AssignEmployeeDialog
        open={assignOpen}
        positionName={node.name}
        designationId={node.id}
        onClose={() => setAssignOpen(false)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// INDUSTRY TYPE SETUP BANNER (super admin only)
// ─────────────────────────────────────────────────────────────

function IndustrySetupBanner({
  currentType, onSeed,
}: {
  currentType: string;
  onSeed: () => void;
}) {
  const [selectedType, setSelectedType] = useState<IndustryType>(currentType as IndustryType);
  const { mutateAsync: updateSettings } = useUpdateOrgSettings();
  const { mutateAsync: seed, isPending } = useSeedDesignations();

  async function handleSeed() {
    try {
      if (selectedType !== currentType) {
        await updateSettings({ industryType: selectedType });
      }
      const result = await seed();
      toast.success(
        `Position chart initialized — ${result.seeded} positions seeded for ${INDUSTRY_LABELS[result.industry as IndustryType] ?? result.industry}`,
      );
      onSeed();
    } catch {
      toast.error('Failed to initialize position chart');
    }
  }

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Building2 className="h-7 w-7 text-primary" />
        </div>
        <div>
          <p className="text-lg font-semibold">Initialize Your Position Chart</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Select your organization type to load a pre-built hierarchy with all standard positions.
            Empty positions show as "Vacant" and fill automatically when employees are hired with a matching designation.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Select value={selectedType} onValueChange={(v) => setSelectedType(v as IndustryType)}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select organization type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(INDUSTRY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleSeed} disabled={isPending} className="gap-2">
            {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Initialize Position Chart
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Positions fill automatically as you hire employees with matching designations.
          Use "Assign" on any position for manual updates.
        </p>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// ZOOMABLE CHART WRAPPER
// ─────────────────────────────────────────────────────────────

function ZoomableChart({ children, defaultZoom = 1 }: { children: React.ReactNode; defaultZoom?: number }) {
  const [zoom, setZoom] = useState(defaultZoom);

  const handleZoom = useCallback((v: number) => {
    setZoom(Math.round(v * 100) / 100);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-xl border bg-card/50">
      <ZoomControls zoom={zoom} onZoom={handleZoom} />
      {/* Scrollable vertically only */}
      <div className="max-h-[70vh] overflow-y-auto overflow-x-hidden py-8">
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            // Compensate height so container doesn't leave dead space when zoomed out
            marginBottom: zoom < 1 ? `calc(${(zoom - 1) * 100}% - 2rem)` : undefined,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────

export default function OrgChartPage() {
  const role = useAuthStore((s) => s.user?.role);
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isHR = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(role ?? '');

  const { data: employees, isLoading: empLoading } = useOrgChart();
  const { data: positionDesignations, isLoading: posLoading } = useDesignationsWithEmployees();
  const { data: orgSettings } = useOrgSettings();
  const { mutateAsync: updateSettings } = useUpdateOrgSettings();
  const { mutateAsync: seed, isPending: seeding } = useSeedDesignations();

  // Position Chart is the default view
  const [activeTab, setActiveTab] = useState<'reporting' | 'positions'>('positions');
  const [showIndustryModal, setShowIndustryModal] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType>('IT_SOFTWARE');

  const reportingRoots = useMemo(() => (employees ? buildTree(employees) : []), [employees]);
  const positionRoots = useMemo(
    () => (positionDesignations ? buildPositionTree(positionDesignations) : []),
    [positionDesignations],
  );
  const printRoots = useMemo(() => pruneVacant(positionRoots), [positionRoots]);

  const hasPositions = (positionDesignations?.length ?? 0) > 0;
  const vacantCount = (positionDesignations ?? []).filter((d) => d.employees.length === 0).length;
  const occupiedCount = (positionDesignations ?? []).filter((d) => d.employees.length > 0).length;

  async function handleConfirmReinit() {
    try {
      await updateSettings({ industryType: selectedIndustry });
      const result = await seed();
      toast.success(`Re-initialized with ${result.seeded} positions`);
      setShowIndustryModal(false);
    } catch {
      toast.error('Failed to re-initialize');
    }
  }

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #org-chart-print-area, #org-chart-print-area * { visibility: visible !important; }
          #org-chart-print-area { position: fixed; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
          @page { size: landscape; margin: 1cm; }
        }
      `}</style>

      <div className="space-y-4">
        {/* Header */}
        <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Organisation Chart</h1>
            {orgSettings && hasPositions && (
              <p className="text-sm text-muted-foreground">
                {INDUSTRY_LABELS[orgSettings.industryType as IndustryType] ?? orgSettings.industryType}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Re-initialize only for super admin */}
            {isSuperAdmin && hasPositions && (
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => {
                  setSelectedIndustry((orgSettings?.industryType as IndustryType) ?? 'IT_SOFTWARE');
                  setShowIndustryModal(true);
                }}
              >
                <RefreshCw className="h-4 w-4" />Re-initialize Template
              </Button>
            )}
            <Button size="sm" variant="outline" className="gap-2" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />Print Chart
            </Button>
          </div>
        </div>

        {/* Stats bar */}
        {hasPositions && activeTab === 'positions' && (
          <div className="no-print flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-muted-foreground">{occupiedCount} filled</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
              <span className="text-muted-foreground">{vacantCount} vacant</span>
            </div>
            <div className="flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Positions fill automatically when employees are hired with a matching designation.
                Print removes vacant positions.
              </span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'reporting' | 'positions')} className="no-print">
          <TabsList>
            <TabsTrigger value="positions" className="gap-1.5">
              <Building2 className="h-3.5 w-3.5" />Position Chart
            </TabsTrigger>
            <TabsTrigger value="reporting" className="gap-1.5">
              <Users className="h-3.5 w-3.5" />Reporting Line
            </TabsTrigger>
          </TabsList>

          {/* ── Position Chart Tab ── */}
          <TabsContent value="positions" className="mt-4">
            {posLoading ? (
              <div className="flex justify-center gap-6 pt-8">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-36 w-48 rounded-xl" />
                ))}
              </div>
            ) : !hasPositions ? (
              isSuperAdmin ? (
                <IndustrySetupBanner
                  currentType={orgSettings?.industryType ?? 'IT_SOFTWARE'}
                  onSeed={() => {}}
                />
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                    <Building2 className="h-12 w-12 text-muted-foreground" />
                    <p className="font-medium">Position chart not set up yet</p>
                    <p className="max-w-sm text-sm text-muted-foreground">
                      The organization chart will be initialized by your Super Administrator.
                      Once set up, filled positions will update automatically as employees are hired.
                    </p>
                  </CardContent>
                </Card>
              )
            ) : (
              <ZoomableChart defaultZoom={0.85}>
                <div className="flex min-w-max justify-center gap-8 px-8">
                  {positionRoots.map((root) => (
                    <PositionNodeCard key={root.id} node={root} depth={0} />
                  ))}
                </div>
              </ZoomableChart>
            )}
          </TabsContent>

          {/* ── Reporting Line Tab ── */}
          <TabsContent value="reporting" className="mt-4">
            {empLoading ? (
              <div className="flex justify-center gap-6 pt-8">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-44 rounded-xl" />
                ))}
              </div>
            ) : reportingRoots.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 py-16">
                  <Network className="h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No employees found. Add employees and set their reporting manager to build the chart.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <ZoomableChart defaultZoom={1}>
                <div className="flex min-w-max justify-center gap-8">
                  {reportingRoots.map((root) => (
                    <ReportingNode key={root.id} node={root} depth={0} />
                  ))}
                </div>
              </ZoomableChart>
            )}
          </TabsContent>
        </Tabs>

        {/* ── PRINT AREA ── */}
        <div id="org-chart-print-area" className="hidden print:block">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold">Organisation Chart</h1>
            {orgSettings && (
              <p className="mt-1 text-sm text-gray-500">
                {INDUSTRY_LABELS[orgSettings.industryType as IndustryType] ?? orgSettings.industryType}
                {' · '}Printed on {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
          {activeTab === 'reporting' ? (
            <div className="flex min-w-max justify-center gap-8">
              {reportingRoots.map((root) => <ReportingNode key={root.id} node={root} depth={0} />)}
            </div>
          ) : printRoots.length === 0 ? (
            <p className="text-center text-gray-400">No employees assigned to positions yet.</p>
          ) : (
            <div className="flex min-w-max justify-center gap-8">
              {printRoots.map((root) => (
                <PositionNodeCard key={root.id} node={root} depth={0} printMode />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Re-initialize Modal (super admin only) */}
      {isSuperAdmin && (
        <Dialog open={showIndustryModal} onOpenChange={setShowIndustryModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Re-initialize Position Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Select the organization type to re-seed the position hierarchy.
                Existing positions won't be deleted — only missing ones from the template will be added.
              </p>
              <Select value={selectedIndustry} onValueChange={(v) => setSelectedIndustry(v as IndustryType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(INDUSTRY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowIndustryModal(false)}>Cancel</Button>
              <Button disabled={seeding} onClick={handleConfirmReinit}>
                {seeding ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                Initialize
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
