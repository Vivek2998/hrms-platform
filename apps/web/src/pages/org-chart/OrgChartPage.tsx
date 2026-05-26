import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  ChevronDown, Network, Printer, Users, Building2, RefreshCw,
  Plus, ZoomIn, ZoomOut, Maximize2, UserPlus, CheckCircle2, XCircle, Clock,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { useOrgChart } from '@/hooks/useDirectory';
import type { OrgChartEmployee } from '@/hooks/useDirectory';
import {
  useDesignationsWithEmployees, useOrgSettings, useUpdateOrgSettings,
  useSeedDesignations, useAssignEmployeeToDesignation,
  useOrgChartPendingRequest, useSubmitOrgChartChangeRequest,
  useApproveOrgChartChangeRequest, useRejectOrgChartChangeRequest,
  type DesignationWithEmployees, type PendingOrgChartRequest,
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
// INFINITE CANVAS — pan + pinch/wheel zoom, fixed container
// ─────────────────────────────────────────────────────────────

interface Transform { zoom: number; x: number; y: number }

function ChartCanvas({ children, contentKey }: { children: React.ReactNode; contentKey?: string | number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef  = useRef<HTMLDivElement>(null);
  const tfRef       = useRef<Transform>({ zoom: 0.85, x: 0, y: 40 });
  const [tf, setTf] = useState<Transform>(tfRef.current);
  const [dragging, setDragging] = useState(false);
  const lastMouse   = useRef({ x: 0, y: 0 });

  /** Apply transform to both the ref (for non-React handlers) and state (for render) */
  const applyTf = useCallback((next: Transform) => {
    tfRef.current = next;
    setTf(next);
  }, []);

  /** Center content inside the container after data loads */
  const center = useCallback((targetZoom?: number) => {
    const container = containerRef.current;
    const content   = contentRef.current;
    if (!container || !content) return;

    const cw = container.clientWidth;
    const ch = container.clientHeight;
    // offsetWidth/Height reflect layout size, unaffected by CSS transform
    const nw = content.offsetWidth;
    const nh = content.offsetHeight;
    if (nw === 0 || nh === 0) return;

    const z = targetZoom ?? Math.min(0.85, (cw - 80) / nw);
    const x = (cw - nw * z) / 2;
    const y = Math.max(32, (ch - nh * z) / 3); // bias toward upper third
    applyTf({ zoom: z, x, y });
  }, [applyTf]);

  /** (Re-)center whenever content data changes */
  useEffect(() => {
    // rAF ensures DOM has been painted with the new children
    const id = requestAnimationFrame(() => center());
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentKey]);

  // ── Wheel: two-finger scroll = pan, pinch (ctrlKey) = zoom ──
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();

    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const { zoom: z, x, y } = tfRef.current;

    if (e.ctrlKey || e.metaKey) {
      // Trackpad pinch OR Ctrl + mouse wheel → zoom towards cursor
      const curX = e.clientX - rect.left;
      const curY = e.clientY - rect.top;
      // Cap factor so one scroll tick doesn't jump too far
      const rawFactor = 1 - e.deltaY * 0.008;
      const factor    = Math.max(0.85, Math.min(1.18, rawFactor));
      const newZoom   = Math.min(3, Math.max(0.1, z * factor));
      const r         = newZoom / z;
      applyTf({ zoom: newZoom, x: curX - (curX - x) * r, y: curY - (curY - y) * r });
    } else {
      // Two-finger scroll → pan
      // deltaMode 0 = pixel, 1 = line (~16px), 2 = page (~400px)
      const mult = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
      applyTf({ zoom: z, x: x - e.deltaX * mult, y: y - e.deltaY * mult });
    }
  }, [applyTf]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // ── Mouse drag: pan on background click ──
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    // Allow drag only from background (not from interactive chart elements)
    if (target.closest('button, input, select, a, [role="button"], [data-radix-popper-content-wrapper]')) return;
    setDragging(true);
    lastMouse.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      const { zoom: z, x, y } = tfRef.current;
      applyTf({ zoom: z, x: x + dx, y: y + dy });
    };
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging, applyTf]);

  // ── Zoom control helpers ──
  function zoomAt(factor: number) {
    const container = containerRef.current;
    if (!container) return;
    const { width, height } = container.getBoundingClientRect();
    const cx = width / 2; const cy = height / 2;
    const { zoom: z, x, y } = tfRef.current;
    const newZoom = Math.min(3, Math.max(0.1, z * factor));
    const r       = newZoom / z;
    applyTf({ zoom: newZoom, x: cx - (cx - x) * r, y: cy - (cy - y) * r });
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative h-[calc(100vh-22rem)] min-h-105 overflow-hidden rounded-xl border bg-muted/10',
        dragging ? 'cursor-grabbing' : 'cursor-grab',
      )}
      onMouseDown={onMouseDown}
    >
      {/* ── Zoom controls (top-right, always on top) ── */}
      <div className="no-print pointer-events-auto absolute right-3 top-3 z-20 flex items-center gap-0.5 rounded-lg border bg-background/95 px-1.5 py-1 shadow-md backdrop-blur-sm select-none">
        <button
          type="button"
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={(e) => { e.stopPropagation(); zoomAt(1 / 1.2); }}
          title="Zoom out (−)"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="min-w-10 rounded px-1 text-center text-xs font-mono text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={(e) => { e.stopPropagation(); zoomAt(1 / (tf.zoom)); center(1); }}
          title="Reset to 100%"
        >
          {Math.round(tf.zoom * 100)}%
        </button>
        <button
          type="button"
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={(e) => { e.stopPropagation(); zoomAt(1.2); }}
          title="Zoom in (+)"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <div className="mx-1 h-3.5 w-px bg-border" />
        <button
          type="button"
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={(e) => { e.stopPropagation(); center(); }}
          title="Fit to screen"
        >
          <Maximize2 className="h-3 w-3" />
        </button>
      </div>

      {/* ── Usage hint ── */}
      <div className="no-print pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border bg-background/80 px-3 py-1 text-[10px] text-muted-foreground backdrop-blur-sm">
        Pinch or Ctrl+scroll to zoom · Drag to pan
      </div>

      {/* ── Canvas content ── */}
      <div
        ref={contentRef}
        style={{
          position: 'absolute',
          transformOrigin: '0 0',
          transform: `translate(${tf.x}px, ${tf.y}px) scale(${tf.zoom})`,
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// REPORTING LINE CHART (managerId-based)
// ─────────────────────────────────────────────────────────────

interface TreeNode extends OrgChartEmployee { children: TreeNode[] }

function buildTree(employees: OrgChartEmployee[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  employees.forEach((e) => map.set(e.id, { ...e, children: [] }));
  const roots: TreeNode[] = [];
  map.forEach((node) => {
    if (node.managerId && map.has(node.managerId)) map.get(node.managerId)!.children.push(node);
    else roots.push(node);
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
          'relative w-44 rounded-xl border bg-card p-3 text-center shadow-sm transition-shadow print:border-gray-300 print:shadow-none cursor-default',
          hasKids && 'cursor-pointer hover:shadow-md',
        )}
        onClick={() => { if (hasKids) setOpen((v) => !v); }}
      >
        <Avatar className="mx-auto h-10 w-10">
          <AvatarImage src={node.avatarUrl ?? undefined} />
          <AvatarFallback className="bg-primary/10 text-xs text-primary">{initials(node.firstName, node.lastName)}</AvatarFallback>
        </Avatar>
        <p className="mt-2 truncate text-sm font-semibold">{node.firstName} {node.lastName}</p>
        <p className="truncate text-xs text-muted-foreground">{node.designation ?? '—'}</p>
        {node.department && <p className="mt-0.5 truncate text-[10px] text-muted-foreground/60">{node.department.name}</p>}
        {hasKids && <ChevronDown className={cn('absolute bottom-1.5 right-1.5 h-3 w-3 text-muted-foreground transition-transform', !open && '-rotate-90')} />}
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

function AssignEmployeeDialog({ open, positionName, designationId, onClose }: {
  open: boolean; positionName: string; designationId: string; onClose: () => void;
}) {
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const { data: employeesData } = useEmployees({ limit: 300 });
  const { mutateAsync: assign, isPending } = useAssignEmployeeToDesignation();

  async function handleAssign() {
    if (!selectedEmpId) return;
    try {
      await assign({ employeeId: selectedEmpId, designationId });
      toast.success('Employee assigned to position');
      setSelectedEmpId(''); onClose();
    } catch { toast.error('Failed to assign employee'); }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setSelectedEmpId(''); onClose(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Assign to "{positionName}"</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Select an employee. Their profile will update automatically.</p>
          <Select value={selectedEmpId} onValueChange={setSelectedEmpId}>
            <SelectTrigger><SelectValue placeholder="Choose an employee..." /></SelectTrigger>
            <SelectContent>
              {(employeesData?.employees ?? []).filter((e) => e.status === 'ACTIVE').map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.firstName} {e.lastName} ({e.employeeCode}){e.designation ? ` — ${e.designation}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!selectedEmpId || isPending} onClick={handleAssign}>
            {isPending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// POSITION NODE
// ─────────────────────────────────────────────────────────────

interface PositionNode extends DesignationWithEmployees { children: PositionNode[] }

function buildPositionTree(designations: DesignationWithEmployees[]): PositionNode[] {
  const map = new Map<string, PositionNode>();
  designations.forEach((d) => map.set(d.id, { ...d, children: [] }));
  const roots: PositionNode[] = [];
  map.forEach((node) => {
    if (node.parentId && map.has(node.parentId)) map.get(node.parentId)!.children.push(node);
    else roots.push(node);
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
    .map((n) => ({ ...n, children: pruneVacant(n.children) }))
    .filter((n) => n.employees.length > 0 || n.children.length > 0);
}

function PositionNodeCard({ node, depth = 0, printMode = false }: {
  node: PositionNode; depth?: number; printMode?: boolean;
}) {
  const [open, setOpen] = useState(depth < 3);
  const [assignOpen, setAssignOpen] = useState(false);
  const hasKids = node.children.length > 0;
  const isEmpty = node.employees.length === 0;

  if (printMode && isEmpty && !hasKids) return null;

  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          'relative w-48 rounded-xl border bg-card text-center shadow-sm transition-shadow print:border-gray-300 print:shadow-none cursor-default',
          isEmpty ? 'border-dashed border-muted-foreground/30 bg-muted/10' : 'border-solid',
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
        <div className={cn('px-3 pt-1.5', hasKids && !printMode ? 'pb-1' : 'pb-3')}>
          {isEmpty ? (
            <>
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                <Users className="h-4 w-4 text-muted-foreground/50" />
              </div>
              <p className="mt-2 text-sm font-semibold">{node.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Vacant</p>
              {!printMode && (
                <Button size="sm" variant="outline" className="mt-2 h-6 w-full gap-1 text-xs"
                  onClick={(e) => { e.stopPropagation(); setAssignOpen(true); }}>
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
                    <AvatarFallback className="bg-primary/10 text-xs text-primary">{initials(emp.firstName, emp.lastName)}</AvatarFallback>
                  </Avatar>
                  <p className="mt-1.5 truncate text-sm font-semibold">{emp.firstName} {emp.lastName}</p>
                  <p className="text-[10px] text-muted-foreground">{emp.employeeCode}</p>
                </div>
              ))}
              <p className="mt-1 text-xs font-medium text-foreground/80">{node.name}</p>
              {!printMode && (
                <Button size="sm" variant="ghost" className="mt-1 h-5 w-full gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                  onClick={(e) => { e.stopPropagation(); setAssignOpen(true); }}>
                  <UserPlus className="h-2.5 w-2.5" />Change
                </Button>
              )}
            </>
          )}
        </div>
        {/* Chevron centered at card bottom — not floating over content */}
        {hasKids && !printMode && (
          <div className="flex justify-center pb-1.5">
            <ChevronDown className={cn('h-3 w-3 text-muted-foreground/50 transition-transform', !open && '-rotate-90')} />
          </div>
        )}
      </div>

      {hasKids && (open || printMode) && (
        <>
          {/* Vertical stem: parent card → T-bar. Longer line gives breathing room below the card */}
          <div className="h-8 w-px bg-border" />
          {/* Siblings row: NO wrap so expanding one branch never shifts adjacent columns.
              items-start anchors each sub-tree at the top — different-height branches
              don't stretch or push their neighbours. */}
          <div className="flex items-start justify-center">
            {node.children
              .filter((c) => !printMode || c.employees.length > 0 || c.children.length > 0)
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
                  {/* Vertical stem: T-bar → child card */}
                  <div className="h-8 w-px bg-border" />
                  <PositionNodeCard node={child} depth={depth + 1} printMode={printMode} />
                </div>
              ))}
          </div>
        </>
      )}
      <AssignEmployeeDialog open={assignOpen} positionName={node.name} designationId={node.id} onClose={() => setAssignOpen(false)} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// INDUSTRY SETUP BANNER (super admin only)
// ─────────────────────────────────────────────────────────────

function IndustrySetupBanner({ currentType, onSeed }: { currentType: string; onSeed: () => void }) {
  const [selectedType, setSelectedType] = useState<IndustryType>(currentType as IndustryType);
  const { mutateAsync: updateSettings } = useUpdateOrgSettings();
  const { mutateAsync: seed, isPending } = useSeedDesignations();

  async function handleSeed() {
    try {
      if (selectedType !== currentType) await updateSettings({ industryType: selectedType });
      const result = await seed();
      toast.success(`Position chart initialized — ${result.seeded} positions seeded for ${INDUSTRY_LABELS[result.industry as IndustryType] ?? result.industry}`);
      onSeed();
    } catch { toast.error('Failed to initialize position chart'); }
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
            Positions fill automatically as employees are hired with a matching designation.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Select value={selectedType} onValueChange={(v) => setSelectedType(v as IndustryType)}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Select organization type" /></SelectTrigger>
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
          Use "Assign" on any position for manual updates.
        </p>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────

export default function OrgChartPage() {
  const role = useAuthStore((s) => s.user?.role);
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isOrgAdmin   = role === 'ORG_ADMIN';
  const canManageChart = isSuperAdmin || isOrgAdmin;

  const { data: employees,            isLoading: empLoading } = useOrgChart();
  const { data: positionDesignations, isLoading: posLoading } = useDesignationsWithEmployees();
  const { data: orgSettings } = useOrgSettings();
  const { mutateAsync: updateSettings } = useUpdateOrgSettings();
  const { mutateAsync: seed, isPending: seeding } = useSeedDesignations();
  const { data: pendingRequest, isLoading: pendingLoading } = useOrgChartPendingRequest();
  const { mutateAsync: submitRequest, isPending: submitting } = useSubmitOrgChartChangeRequest();
  const { mutateAsync: approveRequest, isPending: approving } = useApproveOrgChartChangeRequest();
  const { mutateAsync: rejectRequest,  isPending: rejecting  } = useRejectOrgChartChangeRequest();

  const [activeTab,         setActiveTab]         = useState<'reporting' | 'positions'>('positions');
  const [showIndustryModal, setShowIndustryModal] = useState(false);
  const [selectedIndustry,  setSelectedIndustry]  = useState<IndustryType>('IT_SOFTWARE');
  // ORG_ADMIN request form state
  const [requestReason,    setRequestReason]     = useState('');
  // SUPER_ADMIN approval note state
  const [approvalNote,     setApprovalNote]      = useState('');
  const [showApproveModal, setShowApproveModal]  = useState(false);
  const [showRejectModal,  setShowRejectModal]   = useState(false);

  const reportingRoots = useMemo(() => (employees ? buildTree(employees) : []), [employees]);
  const positionRoots  = useMemo(
    () => (positionDesignations ? buildPositionTree(positionDesignations) : []),
    [positionDesignations],
  );
  const printRoots = useMemo(() => pruneVacant(positionRoots), [positionRoots]);

  const hasPositions  = (positionDesignations?.length ?? 0) > 0;
  const vacantCount   = (positionDesignations ?? []).filter((d) => d.employees.length === 0).length;
  const occupiedCount = (positionDesignations ?? []).filter((d) => d.employees.length > 0).length;

  // Super Admin: direct re-init
  async function handleConfirmReinit() {
    try {
      await updateSettings({ industryType: selectedIndustry });
      const result = await seed();
      toast.success(`Re-initialized with ${result.seeded} positions`);
      setShowIndustryModal(false);
    } catch { toast.error('Failed to re-initialize'); }
  }

  // Org Admin: submit change request
  async function handleSubmitRequest() {
    try {
      await submitRequest({ industryType: selectedIndustry, reason: requestReason || undefined });
      toast.success('Request submitted — awaiting Super Admin approval');
      setShowIndustryModal(false);
      setRequestReason('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit request';
      toast.error(msg);
    }
  }

  // Super Admin: approve pending request
  async function handleApprove() {
    if (!pendingRequest) return;
    try {
      await approveRequest({ id: pendingRequest.id, superAdminNote: approvalNote || undefined });
      toast.success('Request approved — chart updated');
      setShowApproveModal(false);
      setApprovalNote('');
    } catch { toast.error('Failed to approve request'); }
  }

  // Super Admin: reject pending request
  async function handleReject() {
    if (!pendingRequest) return;
    try {
      await rejectRequest({ id: pendingRequest.id, superAdminNote: approvalNote || undefined });
      toast.success('Request rejected');
      setShowRejectModal(false);
      setApprovalNote('');
    } catch { toast.error('Failed to reject request'); }
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
            {canManageChart && hasPositions && (
              <Button size="sm" variant="outline" className="gap-2"
                disabled={isOrgAdmin && !!pendingRequest}
                title={isOrgAdmin && !!pendingRequest ? 'A request is already pending approval' : undefined}
                onClick={() => {
                  setSelectedIndustry((orgSettings?.industryType as IndustryType) ?? 'IT_SOFTWARE');
                  setRequestReason('');
                  setShowIndustryModal(true);
                }}
              >
                <RefreshCw className="h-4 w-4" />
                {isSuperAdmin ? 'Re-initialize Template' : 'Request Template Change'}
              </Button>
            )}
            <Button size="sm" variant="outline" className="gap-2" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />Print Chart
            </Button>
          </div>
        </div>

        {/* Stats */}
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
          </div>
        )}

        {/* ── Pending change-request banner (Super Admin only) ── */}
        {isSuperAdmin && !pendingLoading && pendingRequest && (
          <Card className="no-print border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
            <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                    Pending template change request
                  </p>
                  <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                    <span className="font-medium">{pendingRequest.requestedBy.firstName} {pendingRequest.requestedBy.lastName}</span>
                    {' '}has requested to switch from{' '}
                    <span className="font-medium">{INDUSTRY_LABELS[pendingRequest.currentIndustry as IndustryType] ?? pendingRequest.currentIndustry}</span>
                    {' '}→{' '}
                    <span className="font-medium text-amber-900 dark:text-amber-200">
                      {INDUSTRY_LABELS[pendingRequest.requestedIndustry as IndustryType] ?? pendingRequest.requestedIndustry}
                    </span>
                    {pendingRequest.reason && <><br />Reason: <em>"{pendingRequest.reason}"</em></>}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="outline"
                  className="gap-1.5 border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
                  onClick={() => { setApprovalNote(''); setShowRejectModal(true); }}>
                  <XCircle className="h-3.5 w-3.5" />Reject
                </Button>
                <Button size="sm"
                  className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => { setApprovalNote(''); setShowApproveModal(true); }}>
                  <CheckCircle2 className="h-3.5 w-3.5" />Approve
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Pending request status (Org Admin only) ── */}
        {isOrgAdmin && !pendingLoading && pendingRequest && (
          <div className="no-print flex items-center gap-3 rounded-lg border border-indigo-300 bg-indigo-100 px-4 py-3 dark:border-indigo-700 dark:bg-indigo-900/50">
            <Clock className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-300" />
            <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
              Your request to switch to{' '}
              <span className="font-bold text-indigo-700 dark:text-indigo-300">
                {INDUSTRY_LABELS[pendingRequest.requestedIndustry as IndustryType] ?? pendingRequest.requestedIndustry}
              </span>
              {' '}is awaiting Super Admin approval.
            </p>
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

          {/* ── Position Chart ── */}
          <TabsContent value="positions" className="mt-4">
            {posLoading ? (
              <div className="flex justify-center gap-6 pt-8">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 w-48 rounded-xl" />)}
              </div>
            ) : !hasPositions ? (
              canManageChart ? (
                <IndustrySetupBanner currentType={orgSettings?.industryType ?? 'IT_SOFTWARE'} onSeed={() => {}} />
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                    <Building2 className="h-12 w-12 text-muted-foreground" />
                    <p className="font-medium">Position chart not set up yet</p>
                    <p className="max-w-sm text-sm text-muted-foreground">
                      The organization chart will be initialized by your Administrator.
                      Filled positions update automatically as employees are hired.
                    </p>
                  </CardContent>
                </Card>
              )
            ) : (
              /* Key = length so canvas re-centers when designations first load */
              <ChartCanvas contentKey={positionRoots.length}>
                <div className="flex items-start gap-8 p-12">
                  {positionRoots.map((root) => (
                    <PositionNodeCard key={root.id} node={root} depth={0} />
                  ))}
                </div>
              </ChartCanvas>
            )}
          </TabsContent>

          {/* ── Reporting Line ── */}
          <TabsContent value="reporting" className="mt-4">
            {empLoading ? (
              <div className="flex justify-center gap-6 pt-8">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-44 rounded-xl" />)}
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
              <ChartCanvas contentKey={reportingRoots.length}>
                <div className="flex items-start gap-8 p-12">
                  {reportingRoots.map((root) => <ReportingNode key={root.id} node={root} depth={0} />)}
                </div>
              </ChartCanvas>
            )}
          </TabsContent>
        </Tabs>

        {/* Print area */}
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
            <div className="flex justify-center gap-8">
              {reportingRoots.map((root) => <ReportingNode key={root.id} node={root} depth={0} />)}
            </div>
          ) : printRoots.length === 0 ? (
            <p className="text-center text-gray-400">No employees assigned to positions yet.</p>
          ) : (
            <div className="flex justify-center gap-8">
              {printRoots.map((root) => <PositionNodeCard key={root.id} node={root} depth={0} printMode />)}
            </div>
          )}
        </div>
      </div>

      {/* ── Super Admin: Re-initialize modal ── */}
      {isSuperAdmin && (
        <Dialog open={showIndustryModal} onOpenChange={setShowIndustryModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Re-initialize Position Template</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Select the organisation type to re-seed the hierarchy. Existing positions won't be
                deleted — only missing ones from the template will be added.
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
                {seeding && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}Initialize
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Org Admin: Submit change-request modal ── */}
      {isOrgAdmin && (
        <Dialog open={showIndustryModal} onOpenChange={setShowIndustryModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Request Template Change</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Select the organisation type you'd like to switch to. Your Super Admin will
                receive a notification and must approve before the chart is updated.
              </p>
              <Select value={selectedIndustry} onValueChange={(v) => setSelectedIndustry(v as IndustryType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(INDUSTRY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Reason for change (optional)"
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                maxLength={500}
                rows={3}
                className="resize-none text-sm"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowIndustryModal(false)}>Cancel</Button>
              <Button disabled={submitting} onClick={handleSubmitRequest}>
                {submitting && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}Submit Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Super Admin: Approve modal ── */}
      {isSuperAdmin && (
        <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Approve Template Change</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                This will immediately update the organisation chart to{' '}
                <span className="font-semibold text-foreground">
                  {pendingRequest ? (INDUSTRY_LABELS[pendingRequest.requestedIndustry as IndustryType] ?? pendingRequest.requestedIndustry) : ''}
                </span>.
                Existing positions are preserved; missing template positions will be added.
              </p>
              <Textarea
                placeholder="Optional note to the Org Admin"
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                maxLength={500}
                rows={2}
                className="resize-none text-sm"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApproveModal(false)}>Cancel</Button>
              <Button disabled={approving} className="bg-green-600 hover:bg-green-700 text-white" onClick={handleApprove}>
                {approving && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                <CheckCircle2 className="mr-1.5 h-4 w-4" />Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Super Admin: Reject modal ── */}
      {isSuperAdmin && (
        <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Reject Template Change</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                The Org Admin will be notified that their request was not approved.
              </p>
              <Textarea
                placeholder="Reason for rejection (recommended)"
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                maxLength={500}
                rows={3}
                className="resize-none text-sm"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectModal(false)}>Cancel</Button>
              <Button variant="destructive" disabled={rejecting} onClick={handleReject}>
                {rejecting && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                <XCircle className="mr-1.5 h-4 w-4" />Reject Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
