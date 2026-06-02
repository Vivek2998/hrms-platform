import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStorageState } from '@/hooks/useSessionStorageState';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superAdminApi } from '@/lib/super-admin-api';
import { useSuperAdminAuthStore } from '@/stores/super-admin-auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Plan = 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE';
type Tab = 'organizations' | 'assets' | 'code-requests' | 'org-chart-requests' | 'theme-requests';
type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface OrgChartRequest {
  id: string;
  currentIndustry: string;
  requestedIndustry: string;
  reason: string | null;
  status: RequestStatus;
  superAdminNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  organization: { id: string; name: string; slug: string };
  requestedBy: { id: string; firstName: string; lastName: string; workEmail: string };
}

interface CodeRequest {
  id: string;
  currentPrefix: string;
  requestedPrefix: string;
  applyToExisting: boolean;
  reason: string | null;
  status: RequestStatus;
  superAdminNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  organization: { id: string; name: string; slug: string };
  requestedBy: { id: string; firstName: string; lastName: string; workEmail: string };
}

interface AppliedTheme {
  primaryColor: string | null;
  sidebarStyle: string | null;
  bgImageUrl: string | null;
  backgroundColor: string | null;
  cardColor: string | null;
  appliedAt: string;
}

interface ThemeRequest {
  id: string;
  preferredPrimaryHex: string | null;
  sidebarStyle: string | null;
  wantsBgImage: boolean;
  bgImageUrl: string | null;
  backgroundColor: string | null;
  logoUrl: string | null;
  notes: string | null;
  attachmentUrls: string[];
  status: RequestStatus;
  superAdminNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  organization: { id: string; name: string; slug: string; themeConfig: AppliedTheme | null };
  requestedBy: { id: string; firstName: string; lastName: string; workEmail: string };
}

interface OrgRow {
  id: string;
  name: string;
  slug: string;
  email: string;
  plan: Plan;
  maxEmployees: number;
  isActive: boolean;
  createdAt: string;
  employeeCount: number;
  logoUrl: string | null;
  themeConfig: AppliedTheme | null;
}

const PLAN_COLORS: Record<Plan, string> = {
  FREE: 'secondary',
  STARTER: 'outline',
  GROWTH: 'default',
  ENTERPRISE: 'destructive',
};

function PlanBadge({ plan }: { plan: Plan }) {
  return <Badge variant={PLAN_COLORS[plan] as 'default' | 'secondary' | 'outline' | 'destructive'}>{plan}</Badge>;
}

interface CreateOrgForm {
  name: string;
  slug: string;
  email: string;
  plan: Plan;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
}

function blankForm(): CreateOrgForm {
  return {
    name: '',
    slug: '',
    email: '',
    plan: 'FREE',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPassword: '',
  };
}

// ── Assets editor dialog ───────────────────────────────────────────────────────

interface AssetsDialogProps {
  org: OrgRow | null;
  onClose: () => void;
}

function AssetsDialog({ org, onClose }: AssetsDialogProps) {
  const qc = useQueryClient();
  const [logoUrl, setLogoUrl] = useState(org?.logoUrl ?? '');
  const [error, setError] = useState('');

  const save = useMutation({
    mutationFn: () =>
      superAdminApi.patch(`/super-admin/organizations/${org!.id}`, {
        logoUrl: logoUrl.trim() || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-admin', 'organizations'] });
      onClose();
    },
    onError: () => setError('Failed to save. Check the URL and try again.'),
  });

  if (!org) return null;

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Brand Assets — {org.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Logo preview */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl border bg-muted flex items-center justify-center overflow-hidden shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo preview" className="w-full h-full object-contain" />
              ) : (
                <span className="text-2xl font-bold text-muted-foreground">
                  {org.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Organization Logo URL</Label>
              <Input
                value={logoUrl}
                onChange={(e) => { setLogoUrl(e.target.value); setError(''); }}
                placeholder="https://cdn.example.com/logo.png"
              />
              <p className="text-xs text-muted-foreground">
                Paste a publicly accessible image URL (PNG, SVG, WebP recommended).
              </p>
            </div>
          </div>

          {/* Read-only info */}
          <div className="rounded-lg border bg-muted/40 p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Organization name</span>
              <span className="font-medium">{org.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Slug</span>
              <span className="font-mono text-xs">{org.slug}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan</span>
              <PlanBadge plan={org.plan} />
            </div>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? 'Saving…' : 'Save Assets'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Assets tab ─────────────────────────────────────────────────────────────────

function AssetsTab({ orgs }: { orgs: OrgRow[] }) {
  const [editingOrg, setEditingOrg] = useState<OrgRow | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {orgs.map((org) => (
          <Card key={org.id} className="flex flex-col">
            <CardContent className="pt-5 flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {org.logoUrl ? (
                    <img src={org.logoUrl} alt={org.name} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-xl font-bold text-muted-foreground">
                      {org.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{org.name}</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">{org.slug}</p>
                </div>
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Logo</span>
                  {org.logoUrl ? (
                    <Badge variant="default" className="text-xs">Set</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Not set</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Plan</span>
                  <PlanBadge plan={org.plan} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={org.isActive ? 'default' : 'secondary'}>
                    {org.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardContent>
            <div className="px-5 pb-4">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setEditingOrg(org)}
              >
                Edit Assets
              </Button>
            </div>
          </Card>
        ))}

        {orgs.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground py-10">
            No organizations yet. Add one in the Organizations tab.
          </p>
        )}
      </div>

      {editingOrg && (
        <AssetsDialog org={editingOrg} onClose={() => setEditingOrg(null)} />
      )}
    </>
  );
}

// ── Review dialog ─────────────────────────────────────────────────────────────

interface ReviewDialogProps {
  request: CodeRequest;
  onClose: () => void;
}

function ReviewDialog({ request, onClose }: ReviewDialogProps) {
  const qc = useQueryClient();
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const resolve = useMutation({
    mutationFn: (action: 'APPROVE' | 'REJECT') =>
      superAdminApi.patch(`/super-admin/employee-code-requests/${request.id}`, {
        action,
        superAdminNote: note.trim() || undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['super-admin', 'code-requests'] });
      onClose();
    },
    onError: () => setError('Failed to update request. Please try again.'),
  });

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Review Code Change Request</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Request summary */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Organisation</span>
              <span className="font-semibold">{request.organization.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Requested by</span>
              <span>{request.requestedBy.firstName} {request.requestedBy.lastName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Code change</span>
              <span className="flex items-center gap-2">
                <span className="font-mono bg-red-50 text-red-700 px-2 py-0.5 rounded text-xs font-bold">
                  {request.currentPrefix}-473
                </span>
                <span className="text-muted-foreground">→</span>
                <span className="font-mono bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs font-bold">
                  {request.requestedPrefix}-473
                </span>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Apply retroactively</span>
              <span className="font-medium">
                {request.applyToExisting ? '✅ Yes — rename all existing codes' : '⬜ No — future employees only'}
              </span>
            </div>
            {request.reason && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reason</span>
                <span className="italic text-right max-w-xs">"{request.reason}"</span>
              </div>
            )}
          </div>

          {/* Note field */}
          <div className="space-y-1.5">
            <Label className="text-sm">
              Note to admin <span className="text-muted-foreground text-xs">(optional — shown in email)</span>
            </Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Approved — prefix updated. or Rejected — please use 2-letter prefix only."
              className="resize-none text-sm"
              rows={3}
              maxLength={500}
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={resolve.isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => resolve.mutate('REJECT')}
            disabled={resolve.isPending}
          >
            Reject
          </Button>
          <Button
            onClick={() => resolve.mutate('APPROVE')}
            disabled={resolve.isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {resolve.isPending ? 'Processing…' : 'Approve'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Code Requests tab ──────────────────────────────────────────────────────────

function CodeRequestsTab() {
  const qc = useQueryClient();
  const [filter, setFilter] = useSessionStorageState<'PENDING' | 'ALL'>('super_admin_code_filter', 'PENDING');
  const [reviewing, setReviewing] = useState<CodeRequest | null>(null);

  const { data: requests = [], isLoading } = useQuery<CodeRequest[]>({
    queryKey: ['super-admin', 'code-requests', filter],
    queryFn: async () => {
      const res = await superAdminApi.get<{ data: CodeRequest[] }>(
        `/super-admin/employee-code-requests?status=${filter}`,
      );
      return res.data.data;
    },
  });

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  const statusColors: Record<RequestStatus, string> = {
    PENDING: 'outline',
    APPROVED: 'default',
    REJECTED: 'destructive',
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">Employee Code Change Requests</CardTitle>
            {pendingCount > 0 && (
              <Badge variant="destructive" className="text-xs">{pendingCount} pending</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Show:</span>
            <button
              onClick={() => setFilter('PENDING')}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${filter === 'PENDING' ? 'bg-slate-800 text-white border-slate-800' : 'border-muted-foreground/30 text-muted-foreground hover:border-slate-400'}`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('ALL')}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${filter === 'ALL' ? 'bg-slate-800 text-white border-slate-800' : 'border-muted-foreground/30 text-muted-foreground hover:border-slate-400'}`}
            >
              All
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-10">Loading…</p>
          ) : requests.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">
              {filter === 'PENDING' ? 'No pending requests — all clear! ✅' : 'No requests yet.'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Retroactive</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  {filter === 'PENDING' && <TableHead className="text-right">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{req.organization.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{req.organization.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{req.requestedBy.firstName} {req.requestedBy.lastName}</p>
                        <p className="text-xs text-muted-foreground">{req.requestedBy.workEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded font-bold">
                          {req.currentPrefix}
                        </span>
                        <span className="text-muted-foreground text-xs">→</span>
                        <span className="font-mono text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded font-bold">
                          {req.requestedPrefix}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs">{req.applyToExisting ? '✅ Yes' : '⬜ No'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[req.status] as 'default' | 'outline' | 'destructive'} className="text-xs">
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(req.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </TableCell>
                    {filter === 'PENDING' && (
                      <TableCell className="text-right">
                        {req.status === 'PENDING' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7"
                            onClick={() => setReviewing(req)}
                          >
                            Review
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {reviewing && (
        <ReviewDialog
          request={reviewing}
          onClose={() => {
            setReviewing(null);
            void qc.invalidateQueries({ queryKey: ['super-admin', 'code-requests'] });
          }}
        />
      )}
    </>
  );
}

// ── Org Chart Requests tab ────────────────────────────────────────────────────

const INDUSTRY_LABELS: Record<string, string> = {
  IT_SOFTWARE: 'IT / Software',
  MANUFACTURING: 'Manufacturing',
  HEALTHCARE: 'Healthcare',
  FINANCIAL_SERVICES: 'Financial Services',
  RETAIL: 'Retail',
  EDUCATIONAL: 'Educational',
  SERVICE_BASED: 'Service Based',
  GENERAL: 'General',
};

function ReviewOrgChartDialog({ request, onClose }: { request: OrgChartRequest; onClose: () => void }) {
  const qc = useQueryClient();
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const resolve = useMutation({
    mutationFn: (action: 'APPROVE' | 'REJECT') =>
      superAdminApi.patch(`/super-admin/org-chart-requests/${request.id}`, {
        action,
        superAdminNote: note.trim() || undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['super-admin', 'org-chart-requests'] });
      onClose();
    },
    onError: () => setError('Failed to update request. Please try again.'),
  });

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Review Org Chart Template Request</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Organisation</span>
              <span className="font-semibold">{request.organization.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Requested by</span>
              <span>{request.requestedBy.firstName} {request.requestedBy.lastName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Template change</span>
              <span className="flex items-center gap-2">
                <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded text-xs font-semibold">
                  {INDUSTRY_LABELS[request.currentIndustry] ?? request.currentIndustry}
                </span>
                <span className="text-muted-foreground">→</span>
                <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs font-semibold">
                  {INDUSTRY_LABELS[request.requestedIndustry] ?? request.requestedIndustry}
                </span>
              </span>
            </div>
            {request.reason && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground shrink-0">Reason</span>
                <span className="italic text-right">"{request.reason}"</span>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">
              Note to admin <span className="text-muted-foreground text-xs">(optional — shown in email)</span>
            </Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Approved — template updated. or Rejected — please contact support."
              className="resize-none text-sm"
              rows={3}
              maxLength={500}
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>
        <DialogFooter className="flex gap-3 sm:gap-3">
          <Button variant="outline" onClick={onClose} disabled={resolve.isPending}>Cancel</Button>
          <Button variant="destructive" onClick={() => resolve.mutate('REJECT')} disabled={resolve.isPending}>
            Reject
          </Button>
          <Button onClick={() => resolve.mutate('APPROVE')} disabled={resolve.isPending}
            className="bg-green-600 hover:bg-green-700 text-white">
            {resolve.isPending ? 'Processing…' : 'Approve'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Apply Theme Dialog ─────────────────────────────────────────────────────────

interface ApplyThemeDialogProps {
  request: ThemeRequest;
  onClose: () => void;
}

function ApplyThemeDialog({ request, onClose }: ApplyThemeDialogProps) {
  const qc = useQueryClient();
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const apply = useMutation({
    mutationFn: () =>
      superAdminApi.patch(`/super-admin/theme-requests/${request.id}/apply`, {
        superAdminNote: note.trim() || undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['super-admin', 'theme-requests'] });
      onClose();
    },
    onError: () => setError('Failed to apply theme. Please try again.'),
  });

  const reject = useMutation({
    mutationFn: () =>
      superAdminApi.patch(`/super-admin/theme-requests/${request.id}/reject`, {
        superAdminNote: note.trim() || undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['super-admin', 'theme-requests'] });
      onClose();
    },
    onError: () => setError('Failed to reject request. Please try again.'),
  });

  const isPending = apply.isPending || reject.isPending;

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Theme Request — {request.organization.name}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Requested by {request.requestedBy.firstName} {request.requestedBy.lastName} · {new Date(request.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </DialogHeader>
        <div className="space-y-4 py-1">

          {/* Current vs Requested — side by side */}
          <div className="grid grid-cols-2 gap-3">
            {/* Current applied theme */}
            <div className="rounded-lg border bg-muted/20 p-4 space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Currently Applied</p>
              {request.organization.themeConfig ? (
                <div className="space-y-2 text-sm">
                  {request.organization.themeConfig.primaryColor && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-xs">Primary</span>
                      <div className="flex items-center gap-1.5">
                        <div className="h-4 w-4 rounded border border-border shadow-sm shrink-0" style={{ backgroundColor: request.organization.themeConfig.primaryColor }} />
                        <span className="font-mono text-xs">{request.organization.themeConfig.primaryColor}</span>
                      </div>
                    </div>
                  )}
                  {request.organization.themeConfig.sidebarStyle && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-xs">Sidebar</span>
                      <span className="text-xs capitalize font-medium">{request.organization.themeConfig.sidebarStyle}</span>
                    </div>
                  )}
                  {request.organization.themeConfig.backgroundColor && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-xs">Background</span>
                      <div className="flex items-center gap-1.5">
                        <div className="h-4 w-4 rounded border border-border shadow-sm shrink-0" style={{ backgroundColor: request.organization.themeConfig.backgroundColor }} />
                        <span className="font-mono text-xs">{request.organization.themeConfig.backgroundColor}</span>
                      </div>
                    </div>
                  )}
                  {request.organization.themeConfig.bgImageUrl && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground text-xs shrink-0">Bg image</span>
                      <a href={request.organization.themeConfig.bgImageUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-xs underline truncate">View</a>
                    </div>
                  )}
                  {request.organization.themeConfig.cardColor && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-xs">Card</span>
                      <div className="flex items-center gap-1.5">
                        <div className="h-4 w-4 rounded border border-border shadow-sm shrink-0" style={{ backgroundColor: request.organization.themeConfig.cardColor }} />
                        <span className="font-mono text-xs">{request.organization.themeConfig.cardColor}</span>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground pt-1 border-t">
                    Applied {new Date(request.organization.themeConfig.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Default WorkAxis theme — no custom theme applied yet.</p>
              )}
            </div>

            {/* Requested changes */}
            <div className="rounded-lg border border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20 p-4 space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">Requested Changes</p>
              <div className="space-y-2 text-sm">
                {request.preferredPrimaryHex && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">Primary</span>
                    <div className="flex items-center gap-1.5">
                      <div className="h-4 w-4 rounded border border-border shadow-sm shrink-0" style={{ backgroundColor: request.preferredPrimaryHex }} />
                      <span className="font-mono text-xs">{request.preferredPrimaryHex}</span>
                    </div>
                  </div>
                )}
                {request.sidebarStyle && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">Sidebar</span>
                    <span className="text-xs capitalize font-medium">{request.sidebarStyle}</span>
                  </div>
                )}
                {request.wantsBgImage && request.bgImageUrl && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground text-xs shrink-0">Bg image</span>
                    <a href={request.bgImageUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-xs underline truncate">View</a>
                  </div>
                )}
                {!request.wantsBgImage && request.backgroundColor && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">Background</span>
                    <div className="flex items-center gap-1.5">
                      <div className="h-4 w-4 rounded border border-border shadow-sm shrink-0" style={{ backgroundColor: request.backgroundColor }} />
                      <span className="font-mono text-xs">{request.backgroundColor}</span>
                    </div>
                  </div>
                )}
                {request.logoUrl && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground text-xs shrink-0">Logo</span>
                    <img src={request.logoUrl} alt="Logo" className="h-8 w-16 object-contain rounded border bg-white" />
                  </div>
                )}
                {!request.preferredPrimaryHex && !request.sidebarStyle && !request.bgImageUrl && !request.backgroundColor && !request.logoUrl && (
                  <p className="text-xs text-muted-foreground">No specific values — see notes below.</p>
                )}
              </div>
            </div>
          </div>

          {/* Notes + attachments */}
          {(request.notes || request.attachmentUrls.length > 0) && (
            <div className="rounded-lg border bg-muted/20 p-4 space-y-2 text-sm">
              {request.notes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Admin notes</p>
                  <p className="italic text-sm">"{request.notes}"</p>
                </div>
              )}
              {request.attachmentUrls.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Branding files ({request.attachmentUrls.length})</p>
                  <ul className="space-y-0.5">
                    {request.attachmentUrls.map((url, i) => (
                      <li key={i}>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary text-xs underline truncate block">{url}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
            Clicking <strong>Apply</strong> will immediately update this organisation's live theme.
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">
              Note to admin <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Theme applied as requested. or Request rejected — please resubmit with a valid logo URL."
              className="resize-none text-sm"
              rows={3}
              maxLength={500}
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>
        <DialogFooter className="flex gap-3 sm:gap-3">
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button variant="destructive" onClick={() => reject.mutate()} disabled={isPending}>
            Reject
          </Button>
          <Button
            onClick={() => apply.mutate()}
            disabled={isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {apply.isPending ? 'Applying…' : 'Apply Theme'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Theme Requests Tab ─────────────────────────────────────────────────────────

function ThemeRequestsTab() {
  const qc = useQueryClient();
  const [filter, setFilter] = useSessionStorageState<'PENDING' | 'ALL'>('super_admin_theme_filter', 'PENDING');
  const [reviewing, setReviewing] = useState<ThemeRequest | null>(null);

  const { data: requests = [], isLoading } = useQuery<ThemeRequest[]>({
    queryKey: ['super-admin', 'theme-requests', filter],
    queryFn: async () => {
      const res = await superAdminApi.get<{ data: ThemeRequest[] }>(
        `/super-admin/theme-requests?status=${filter}`,
      );
      return res.data.data;
    },
  });

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  const statusColors: Record<RequestStatus, string> = {
    PENDING: 'outline',
    APPROVED: 'default',
    REJECTED: 'destructive',
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">Organisation Theme Requests</CardTitle>
            {pendingCount > 0 && (
              <Badge variant="destructive" className="text-xs">{pendingCount} pending</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Show:</span>
            {(['PENDING', 'ALL'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${filter === f ? 'bg-slate-800 text-white border-slate-800' : 'border-muted-foreground/30 text-muted-foreground hover:border-slate-400'}`}>
                {f === 'PENDING' ? 'Pending' : 'All'}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-10">Loading…</p>
          ) : requests.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">
              {filter === 'PENDING' ? 'No pending theme requests — all clear! ✅' : 'No requests yet.'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Primary Colour</TableHead>
                  <TableHead>Sidebar</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  {filter === 'PENDING' && <TableHead className="w-24 text-right">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{req.organization.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{req.organization.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{req.requestedBy.firstName} {req.requestedBy.lastName}</p>
                        <p className="text-xs text-muted-foreground">{req.requestedBy.workEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {req.preferredPrimaryHex ? (
                        <div className="flex items-center gap-1.5">
                          <div
                            className="h-4 w-4 rounded border border-border shadow-sm shrink-0"
                            style={{ backgroundColor: req.preferredPrimaryHex }}
                          />
                          <span className="font-mono text-xs">{req.preferredPrimaryHex}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs capitalize">{req.sidebarStyle ?? '—'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[req.status] as 'default' | 'outline' | 'destructive'} className="text-xs">
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(req.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </TableCell>
                    {filter === 'PENDING' && (
                      <TableCell className="w-24">
                        <div className="flex justify-end">
                          {req.status === 'PENDING' && (
                            <Button size="sm" variant="outline" className="text-xs h-7"
                              onClick={() => setReviewing(req)}>
                              Review
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {reviewing && (
        <ApplyThemeDialog
          request={reviewing}
          onClose={() => {
            setReviewing(null);
            void qc.invalidateQueries({ queryKey: ['super-admin', 'theme-requests'] });
          }}
        />
      )}
    </>
  );
}

function OrgChartRequestsTab() {
  const qc = useQueryClient();
  const [filter, setFilter] = useSessionStorageState<'PENDING' | 'ALL'>('super_admin_chart_filter', 'PENDING');
  const [reviewing, setReviewing] = useState<OrgChartRequest | null>(null);

  const { data: requests = [], isLoading } = useQuery<OrgChartRequest[]>({
    queryKey: ['super-admin', 'org-chart-requests', filter],
    queryFn: async () => {
      const res = await superAdminApi.get<{ data: OrgChartRequest[] }>(
        `/super-admin/org-chart-requests?status=${filter}`,
      );
      return res.data.data;
    },
  });

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  const statusColors: Record<RequestStatus, string> = {
    PENDING: 'outline',
    APPROVED: 'default',
    REJECTED: 'destructive',
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">Org Chart Template Change Requests</CardTitle>
            {pendingCount > 0 && (
              <Badge variant="destructive" className="text-xs">{pendingCount} pending</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Show:</span>
            {(['PENDING', 'ALL'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${filter === f ? 'bg-slate-800 text-white border-slate-800' : 'border-muted-foreground/30 text-muted-foreground hover:border-slate-400'}`}>
                {f === 'PENDING' ? 'Pending' : 'All'}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-10">Loading…</p>
          ) : requests.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">
              {filter === 'PENDING' ? 'No pending requests — all clear! ✅' : 'No requests yet.'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Template Change</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  {filter === 'PENDING' && <TableHead className="w-24 text-right">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{req.organization.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{req.organization.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{req.requestedBy.firstName} {req.requestedBy.lastName}</p>
                        <p className="text-xs text-muted-foreground">{req.requestedBy.workEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded font-semibold">
                          {INDUSTRY_LABELS[req.currentIndustry] ?? req.currentIndustry}
                        </span>
                        <span className="text-muted-foreground text-xs">→</span>
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded font-semibold">
                          {INDUSTRY_LABELS[req.requestedIndustry] ?? req.requestedIndustry}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[req.status] as 'default' | 'outline' | 'destructive'} className="text-xs">
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(req.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </TableCell>
                    {filter === 'PENDING' && (
                      <TableCell className="w-24">
                        <div className="flex justify-end">
                          {req.status === 'PENDING' && (
                            <Button size="sm" variant="outline" className="text-xs h-7"
                              onClick={() => setReviewing(req)}>
                              Review
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {reviewing && (
        <ReviewOrgChartDialog
          request={reviewing}
          onClose={() => {
            setReviewing(null);
            void qc.invalidateQueries({ queryKey: ['super-admin', 'org-chart-requests'] });
          }}
        />
      )}
    </>
  );
}

// ── Main dashboard ─────────────────────────────────────────────────────────────

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  // Separate selectors → primitives/stable refs → no infinite re-render loop
  const admin  = useSuperAdminAuthStore((s) => s.admin);
  const logout = useSuperAdminAuthStore((s) => s.logout);
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useSessionStorageState<Tab>('super_admin_tab', 'organizations');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateOrgForm>(blankForm());
  const [formError, setFormError] = useState('');

  const { data: pendingOrgChartCount = 0 } = useQuery<number>({
    queryKey: ['super-admin', 'org-chart-requests', 'pending-count'],
    queryFn: async () => {
      const res = await superAdminApi.get<{ data: { id: string }[] }>(
        '/super-admin/org-chart-requests?status=PENDING',
      );
      return res.data.data.length;
    },
    refetchInterval: 60_000,
  });

  const { data: pendingThemeCount = 0 } = useQuery<number>({
    queryKey: ['super-admin', 'theme-requests', 'pending-count'],
    queryFn: async () => {
      const res = await superAdminApi.get<{ data: { id: string }[] }>(
        '/super-admin/theme-requests?status=PENDING',
      );
      return res.data.data.length;
    },
    refetchInterval: 60_000,
  });

  const { data: orgs = [], isLoading } = useQuery<OrgRow[]>({
    queryKey: ['super-admin', 'organizations'],
    queryFn: async () => {
      const res = await superAdminApi.get<{ data: OrgRow[] }>('/super-admin/organizations');
      return res.data.data;
    },
  });

  const createOrg = useMutation({
    mutationFn: (data: CreateOrgForm) =>
      superAdminApi.post('/super-admin/organizations', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-admin', 'organizations'] });
      setShowCreate(false);
      setForm(blankForm());
      setFormError('');
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setFormError(err.response?.data?.error ?? 'Something went wrong');
    },
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      superAdminApi.patch(`/super-admin/organizations/${id}`, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-admin', 'organizations'] });
    },
  });

  const changePlan = useMutation({
    mutationFn: ({ id, plan }: { id: string; plan: Plan }) =>
      superAdminApi.patch(`/super-admin/organizations/${id}`, { plan }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-admin', 'organizations'] });
    },
  });

  function handleLogout() {
    logout();
    navigate('/super-admin/login');
  }

  function set(field: keyof CreateOrgForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (field === 'name') {
      setForm((f) => ({
        ...f,
        name: value,
        slug: value
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .slice(0, 50),
      }));
    }
  }

  const totalOrgs = orgs.length;
  const activeOrgs = orgs.filter((o) => o.isActive).length;
  const totalEmployees = orgs.reduce((sum, o) => sum + o.employeeCount, 0);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg">HRMS</span>
          <Badge variant="outline" className="text-xs">Super Admin</Badge>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{admin?.email}</span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Total Organizations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalOrgs}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{activeOrgs}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Total Employees</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalEmployees}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 border-b">
          {([
            { key: 'organizations', label: 'Organizations' },
            { key: 'assets', label: 'Assets' },
            { key: 'code-requests', label: 'Code Requests' },
            { key: 'org-chart-requests', label: 'Org Chart Requests', badge: pendingOrgChartCount },
            { key: 'theme-requests', label: 'Theme Requests', badge: pendingThemeCount },
          ] as { key: Tab; label: string; badge?: number }[]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {tab.badge != null && tab.badge > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Organizations tab */}
        {activeTab === 'organizations' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Organizations</CardTitle>
              <Button size="sm" onClick={() => setShowCreate(true)}>
                + Add Organization
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <p className="text-center text-muted-foreground py-10">Loading…</p>
              ) : orgs.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">No organizations yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead>Theme</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orgs.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                              {org.logoUrl ? (
                                <img src={org.logoUrl} alt={org.name} className="w-full h-full object-contain" />
                              ) : (
                                <span className="text-xs font-bold text-muted-foreground">
                                  {org.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{org.name}</p>
                              <p className="text-xs text-muted-foreground">{org.slug}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={org.plan}
                            onValueChange={(v) => changePlan.mutate({ id: org.id, plan: v as Plan })}
                          >
                            <SelectTrigger className="h-7 w-32 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(['FREE', 'STARTER', 'GROWTH', 'ENTERPRISE'] as Plan[]).map((p) => (
                                <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{org.employeeCount} / {org.maxEmployees}</span>
                        </TableCell>
                        <TableCell>
                          {org.themeConfig ? (
                            <div className="flex items-center gap-1.5">
                              {org.themeConfig.primaryColor && (
                                <div
                                  className="h-4 w-4 rounded-full border border-border shadow-sm shrink-0"
                                  style={{ backgroundColor: org.themeConfig.primaryColor }}
                                  title={`Primary: ${org.themeConfig.primaryColor}`}
                                />
                              )}
                              <span className="text-xs capitalize text-muted-foreground">
                                {org.themeConfig.sidebarStyle ?? 'light'}
                              </span>
                              {org.themeConfig.bgImageUrl && (
                                <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">img</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Default</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={org.isActive ? 'default' : 'secondary'}>
                            {org.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(org.createdAt).toLocaleDateString('en-IN')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => toggleStatus.mutate({ id: org.id, isActive: !org.isActive })}
                          >
                            {org.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Assets tab */}
        {activeTab === 'assets' && (
          isLoading ? (
            <p className="text-center text-muted-foreground py-10">Loading…</p>
          ) : (
            <AssetsTab orgs={orgs} />
          )
        )}

        {/* Code Requests tab */}
        {activeTab === 'code-requests' && <CodeRequestsTab />}

        {/* Org Chart Requests tab */}
        {activeTab === 'org-chart-requests' && <OrgChartRequestsTab />}
        {activeTab === 'theme-requests' && <ThemeRequestsTab />}
      </main>

      {/* Create Organization Dialog */}
      <Dialog open={showCreate} onOpenChange={(o) => { setShowCreate(o); if (!o) { setForm(blankForm()); setFormError(''); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Organization</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Company Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Company Name</Label>
                <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Acme Pvt Ltd" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Slug</Label>
                <Input value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder="acme-pvt-ltd" />
                <p className="text-xs text-muted-foreground">Login URL: /login?org={form.slug || 'slug'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Company Email</Label>
                <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="hr@acme.in" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Subscription Plan</Label>
                <Select value={form.plan} onValueChange={(v) => set('plan', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FREE">FREE (10 employees)</SelectItem>
                    <SelectItem value="STARTER">STARTER (25 employees)</SelectItem>
                    <SelectItem value="GROWTH">GROWTH (100 employees)</SelectItem>
                    <SelectItem value="ENTERPRISE">ENTERPRISE (999 employees)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pt-2">Admin Account</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">First Name</Label>
                <Input value={form.adminFirstName} onChange={(e) => set('adminFirstName', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Last Name</Label>
                <Input value={form.adminLastName} onChange={(e) => set('adminLastName', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Work Email</Label>
                <Input type="email" value={form.adminEmail} onChange={(e) => set('adminEmail', e.target.value)} placeholder="admin@acme.in" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Initial Password</Label>
                <Input type="password" value={form.adminPassword} onChange={(e) => set('adminPassword', e.target.value)} placeholder="Min 8 characters" />
              </div>
            </div>

            {formError && <p className="text-destructive text-sm">{formError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              onClick={() => createOrg.mutate(form)}
              disabled={createOrg.isPending}
            >
              {createOrg.isPending ? 'Creating…' : 'Create Organization'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
