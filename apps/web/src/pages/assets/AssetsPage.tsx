import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Package, Plus, Laptop, Phone, Monitor, Keyboard, User, RotateCcw, Pencil, Trash2 } from 'lucide-react';
import { useAssets, useCreateAsset, useDeleteAsset, useAssignAsset, useReturnAsset, Asset, AssetCategory } from '@/hooks/useAssets';
import { useEmployees } from '@/hooks/useEmployees';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  LAPTOP: Laptop, DESKTOP: Monitor, PHONE: Phone, TABLET: Phone,
  MONITOR: Monitor, KEYBOARD: Keyboard,
};

const CATEGORIES: AssetCategory[] = ['LAPTOP','DESKTOP','PHONE','TABLET','MONITOR','KEYBOARD','MOUSE','HEADSET','CHAIR','DESK','ID_CARD','ACCESS_CARD','OTHER'];
const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-700',
  ASSIGNED: 'bg-blue-100 text-blue-700',
  UNDER_REPAIR: 'bg-yellow-100 text-yellow-700',
  RETIRED: 'bg-gray-100 text-gray-600',
  LOST: 'bg-red-100 text-red-700',
};

const createSchema = z.object({
  name: z.string().min(1, 'Required'),
  category: z.string().optional(),
  serialNumber: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  purchasePrice: z.coerce.number().positive().optional().or(z.literal('')),
  purchaseDate: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  notes: z.string().optional(),
});

export default function AssetsPage() {
  const { user } = useAuthStore();
  const isHr = HR_ROLES.includes(user?.role ?? '');
  const { data: assets = [], isLoading } = useAssets();
  const createAsset = useCreateAsset();
  const deleteAsset = useDeleteAsset();
  const assignAsset = useAssignAsset();
  const returnAsset = useReturnAsset();
  const { data: employees = [] } = useEmployees();

  const [showCreate, setShowCreate] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Asset | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [search, setSearch] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(createSchema) });

  const filtered = assets.filter(a => {
    if (filterStatus !== 'ALL' && a.status !== filterStatus) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) &&
        !(a.serialNumber?.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const onCreateSubmit = async (data: any) => {
    try {
      await createAsset.mutateAsync({ ...data, purchasePrice: data.purchasePrice || undefined });
      toast.success('Asset created');
      setShowCreate(false);
      reset();
    } catch { toast.error('Failed to create asset'); }
  };

  const onAssign = async () => {
    if (!assignTarget || !selectedEmployeeId) return;
    try {
      await assignAsset.mutateAsync({ id: assignTarget.id, employeeId: selectedEmployeeId });
      toast.success('Asset assigned');
      setAssignTarget(null);
      setSelectedEmployeeId('');
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? 'Failed to assign');
    }
  };

  const onReturn = async (asset: Asset) => {
    try {
      await returnAsset.mutateAsync({ id: asset.id });
      toast.success('Asset returned');
    } catch { toast.error('Failed to return asset'); }
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this asset?')) return;
    try {
      await deleteAsset.mutateAsync(id);
      toast.success('Asset deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const CategoryIcon = ({ category }: { category: string }) => {
    const Icon = CATEGORY_ICONS[category] ?? Package;
    return <Icon className="h-4 w-4" />;
  };

  if (isLoading) return <div className="p-6 text-center text-muted-foreground">Loading assets…</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Asset Management</h1>
          <p className="text-muted-foreground text-sm">Track and manage company assets</p>
        </div>
        {isHr && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Asset
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {(['ALL','AVAILABLE','ASSIGNED','UNDER_REPAIR','RETIRED'] as const).map(s => (
          <button key={s}
            onClick={() => setFilterStatus(s)}
            className={`p-4 rounded-xl border text-left transition-all ${filterStatus === s ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-card hover:border-primary/40'}`}>
            <p className="text-xs text-muted-foreground font-medium">{s === 'ALL' ? 'Total' : s.replace('_', ' ')}</p>
            <p className="text-2xl font-bold mt-1">
              {s === 'ALL' ? assets.length : assets.filter(a => a.status === s).length}
            </p>
          </button>
        ))}
      </div>

      {/* Search */}
      <Input placeholder="Search by name or serial number…" value={search}
        onChange={e => setSearch(e.target.value)} className="max-w-sm" />

      {/* Table */}
      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Asset</th>
              <th className="text-left px-4 py-3 font-medium">Category</th>
              <th className="text-left px-4 py-3 font-medium">Serial No.</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              {isHr && <th className="text-left px-4 py-3 font-medium">Assigned To</th>}
              {isHr && <th className="px-4 py-3 font-medium text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No assets found</td></tr>
            ) : filtered.map(asset => {
              const currentAssignment = asset.assignments?.[0];
              return (
                <tr key={asset.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-muted"><CategoryIcon category={asset.category} /></div>
                      <div>
                        <p className="font-medium">{asset.name}</p>
                        {asset.brand && <p className="text-xs text-muted-foreground">{asset.brand} {asset.model}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{asset.category.replace('_', ' ')}</td>
                  <td className="px-4 py-3 font-mono text-xs">{asset.serialNumber ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge className={STATUS_COLORS[asset.status] ?? ''}>
                      {asset.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  {isHr && (
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {currentAssignment
                        ? `${currentAssignment.employee.firstName} ${currentAssignment.employee.lastName}`
                        : '—'}
                    </td>
                  )}
                  {isHr && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        {asset.status === 'AVAILABLE' && (
                          <Button size="sm" variant="outline" onClick={() => setAssignTarget(asset)}>
                            <User className="h-3 w-3 mr-1" /> Assign
                          </Button>
                        )}
                        {asset.status === 'ASSIGNED' && (
                          <Button size="sm" variant="outline" onClick={() => onReturn(asset)}>
                            <RotateCcw className="h-3 w-3 mr-1" /> Return
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => onDelete(asset.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create Asset Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add New Asset</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label>Asset Name *</Label>
                <Input {...register('name')} placeholder="MacBook Pro 14" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message as string}</p>}
              </div>
              <div className="space-y-1">
                <Label>Category</Label>
                <select {...register('category')} className="w-full border rounded-md px-3 py-2 text-sm bg-background">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Serial Number</Label>
                <Input {...register('serialNumber')} placeholder="SN-12345" />
              </div>
              <div className="space-y-1">
                <Label>Brand</Label>
                <Input {...register('brand')} placeholder="Apple" />
              </div>
              <div className="space-y-1">
                <Label>Model</Label>
                <Input {...register('model')} placeholder="MNW83HN/A" />
              </div>
              <div className="space-y-1">
                <Label>Purchase Price (₹)</Label>
                <Input type="number" {...register('purchasePrice')} placeholder="150000" />
              </div>
              <div className="space-y-1">
                <Label>Purchase Date</Label>
                <Input type="date" {...register('purchaseDate')} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Warranty Expiry</Label>
                <Input type="date" {...register('warrantyExpiry')} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Notes</Label>
                <Input {...register('notes')} placeholder="Any notes…" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={createAsset.isPending}>
                {createAsset.isPending ? 'Creating…' : 'Create Asset'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={!!assignTarget} onOpenChange={() => setAssignTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign — {assignTarget?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Select Employee</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger><SelectValue placeholder="Choose employee…" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e: any) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.firstName} {e.lastName} ({e.employeeCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAssignTarget(null)}>Cancel</Button>
              <Button onClick={onAssign} disabled={!selectedEmployeeId || assignAsset.isPending}>
                {assignAsset.isPending ? 'Assigning…' : 'Assign Asset'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
