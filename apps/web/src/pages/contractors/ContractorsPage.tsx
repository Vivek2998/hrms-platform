import { useState } from 'react';
import { Briefcase, Plus, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useContractors,
  useContractor,
  useCreateContractor,
  useCreatePO,
  useUpdatePOStatus,
} from '@/hooks/useContractors';
import { useAuthStore } from '@/stores/auth.store';
import { format } from 'date-fns';

const TYPE_META: Record<string, { label: string; className: string }> = {
  INDIVIDUAL: { label: 'Individual', className: 'bg-blue-100 text-blue-700' },
  AGENCY: { label: 'Agency', className: 'bg-purple-100 text-purple-700' },
  FREELANCER: { label: 'Freelancer', className: 'bg-orange-100 text-orange-700' },
};

const STATUS_META: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Active', className: 'bg-green-100 text-green-700' },
  INACTIVE: { label: 'Inactive', className: 'bg-gray-100 text-gray-500' },
  BLACKLISTED: { label: 'Blacklisted', className: 'bg-red-100 text-red-700' },
};

const PO_STATUS_META: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-700',
  INVOICED: 'bg-yellow-100 text-yellow-700',
  PAID: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-500',
};

function fmtINR(amount: number) {
  return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
}

function ContractorDrawer({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const { data: contractor, isLoading } = useContractor(id);
  const createPO = useCreatePO();
  const updatePOStatus = useUpdatePOStatus();
  const [showAddPO, setShowAddPO] = useState(false);
  const [poForm, setPoForm] = useState({ poNumber: '', amount: '', description: '' });

  async function handleAddPO() {
    if (!poForm.poNumber || !poForm.amount) return;
    await createPO.mutateAsync({
      contractorId: id,
      poNumber: poForm.poNumber,
      amount: Number(poForm.amount),
      description: poForm.description || undefined,
    });
    setPoForm({ poNumber: '', amount: '', description: '' });
    setShowAddPO(false);
  }

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Contractor Details</SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : contractor ? (
          <div className="space-y-6">
            {/* Details */}
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div>
                  <p className="text-muted-foreground text-xs">Name</p>
                  <p className="font-semibold">{contractor.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Type</p>
                  <Badge
                    variant="outline"
                    className={`text-xs ${TYPE_META[contractor.type]?.className ?? ''}`}
                  >
                    {TYPE_META[contractor.type]?.label ?? contractor.type}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Email</p>
                  <p>{contractor.email ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Phone</p>
                  <p>{contractor.phone ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Daily Rate</p>
                  <p className="font-medium">
                    {contractor.dailyRate != null ? fmtINR(contractor.dailyRate) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Status</p>
                  <Badge
                    variant="outline"
                    className={`text-xs ${STATUS_META[contractor.status]?.className ?? ''}`}
                  >
                    {STATUS_META[contractor.status]?.label ?? contractor.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* PO List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Purchase Orders</h3>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowAddPO(true)}>
                  <Plus className="h-3.5 w-3.5" /> Add PO
                </Button>
              </div>
              {!contractor.purchaseOrders?.length ? (
                <p className="text-sm text-muted-foreground">No purchase orders yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="pb-2 text-left text-xs font-medium text-muted-foreground">PO Number</th>
                        <th className="pb-2 text-right text-xs font-medium text-muted-foreground">Amount</th>
                        <th className="pb-2 text-left text-xs font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {contractor.purchaseOrders.map((po: any) => (
                        <tr key={po.id} className="hover:bg-muted/20">
                          <td className="py-2 font-mono text-xs">{po.poNumber}</td>
                          <td className="py-2 text-right font-medium">{fmtINR(po.amount)}</td>
                          <td className="py-2">
                            <Select
                              value={po.status}
                              onValueChange={(val) =>
                                updatePOStatus.mutate({
                                  contractorId: id,
                                  poId: po.id,
                                  status: val,
                                })
                              }
                            >
                              <SelectTrigger className="h-6 w-[100px] text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.keys(PO_STATUS_META).map((s) => (
                                  <SelectItem key={s} value={s} className="text-xs">
                                    {s}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Could not load contractor details.</p>
        )}

        {/* Add PO Dialog */}
        <Dialog open={showAddPO} onOpenChange={setShowAddPO}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Add Purchase Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>PO Number *</Label>
                <Input
                  value={poForm.poNumber}
                  onChange={(e) => setPoForm((f) => ({ ...f, poNumber: e.target.value }))}
                  placeholder="e.g. PO-2025-001"
                />
              </div>
              <div>
                <Label>Amount (₹) *</Label>
                <Input
                  type="number"
                  value={poForm.amount}
                  onChange={(e) => setPoForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="e.g. 150000"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={poForm.description}
                  onChange={(e) => setPoForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Scope of work"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddPO(false)}>Cancel</Button>
              <Button
                onClick={handleAddPO}
                disabled={!poForm.poNumber || !poForm.amount || createPO.isPending}
              >
                {createPO.isPending ? 'Adding…' : 'Add PO'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
}

export default function ContractorsPage() {
  const user = useAuthStore((s) => s.user);
  const isHR = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(user?.role ?? '');

  const { data: contractors = [], isLoading } = useContractors();
  const createContractor = useCreateContractor();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'INDIVIDUAL',
    email: '',
    phone: '',
    dailyRate: '',
    gstin: '',
    panNumber: '',
  });

  if (!isHR) {
    return (
      <div className="p-6 flex flex-col items-center justify-center py-32">
        <AlertTriangle className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Access Restricted</h3>
        <p className="text-sm text-muted-foreground mt-1">
          This page is available to HR and administrators only.
        </p>
      </div>
    );
  }

  async function handleCreate() {
    if (!form.name) return;
    await createContractor.mutateAsync({
      name: form.name,
      type: form.type,
      email: form.email || undefined,
      phone: form.phone || undefined,
      dailyRate: form.dailyRate ? Number(form.dailyRate) : undefined,
      gstin: form.gstin || undefined,
      panNumber: form.panNumber || undefined,
    });
    setForm({ name: '', type: 'INDIVIDUAL', email: '', phone: '', dailyRate: '', gstin: '', panNumber: '' });
    setShowAdd(false);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
            <Briefcase className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Contractors</h1>
            <p className="text-sm text-muted-foreground">
              Manage external contractors, agencies, and freelancers
            </p>
          </div>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Contractor
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : contractors.length === 0 ? (
          <div className="py-20 text-center">
            <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No contractors yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Add your first contractor to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Daily Rate</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">POs</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {contractors.map((c: any) => {
                  const typeMeta = TYPE_META[c.type] ?? TYPE_META['INDIVIDUAL'];
                  const statusMeta = STATUS_META[c.status] ?? STATUS_META['ACTIVE'];
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-muted/20 cursor-pointer"
                      onClick={() => setSelectedId(c.id)}
                    >
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-xs ${typeMeta.className}`}>
                          {typeMeta.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{c.email ?? '—'}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        {c.dailyRate != null ? fmtINR(c.dailyRate) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-xs ${statusMeta.className}`}>
                          {statusMeta.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {c.poCount ?? 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedId && (
        <ContractorDrawer id={selectedId} onClose={() => setSelectedId(null)} />
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Contractor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Contractor or agency name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_META).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Daily Rate (₹)</Label>
                <Input
                  type="number"
                  value={form.dailyRate}
                  onChange={(e) => setForm((f) => ({ ...f, dailyRate: e.target.value }))}
                  placeholder="e.g. 5000"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>GSTIN</Label>
                <Input
                  value={form.gstin}
                  onChange={(e) => setForm((f) => ({ ...f, gstin: e.target.value }))}
                  placeholder="22AAAAA0000A1Z5"
                />
              </div>
              <div>
                <Label>PAN</Label>
                <Input
                  value={form.panNumber}
                  onChange={(e) => setForm((f) => ({ ...f, panNumber: e.target.value }))}
                  placeholder="AAAPL1234C"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={!form.name || createContractor.isPending}
            >
              {createContractor.isPending ? 'Adding…' : 'Add Contractor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
