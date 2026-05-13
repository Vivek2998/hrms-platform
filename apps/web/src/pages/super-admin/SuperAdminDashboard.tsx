import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superAdminApi } from '@/lib/super-admin-api';
import { useSuperAdminAuthStore } from '@/stores/super-admin-auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { admin, logout } = useSuperAdminAuthStore();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateOrgForm>(blankForm());
  const [formError, setFormError] = useState('');

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
    // Auto-generate slug from name
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

        {/* Organizations Table */}
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
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orgs.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{org.name}</p>
                          <p className="text-xs text-muted-foreground">{org.slug}</p>
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
