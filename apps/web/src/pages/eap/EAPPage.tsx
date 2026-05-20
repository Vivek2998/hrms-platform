import { useState } from 'react';
import { Heart, DollarSign, Scale, Leaf, AlertTriangle, Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useEAPResources,
  useCreateEAPResource,
  useUpdateEAPResource,
  useDeleteEAPResource,
} from '@/hooks/useEAP';
import { useAuthStore } from '@/stores/auth.store';

const CATEGORIES = [
  'ALL',
  'COUNSELING',
  'FINANCIAL',
  'LEGAL',
  'WELLNESS',
  'CRISIS',
] as const;

type Category = (typeof CATEGORIES)[number];

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  COUNSELING: { label: 'Counseling', icon: Heart, color: 'text-pink-500' },
  FINANCIAL: { label: 'Financial', icon: DollarSign, color: 'text-green-500' },
  LEGAL: { label: 'Legal', icon: Scale, color: 'text-blue-500' },
  WELLNESS: { label: 'Wellness', icon: Leaf, color: 'text-emerald-500' },
  CRISIS: { label: 'Crisis', icon: AlertTriangle, color: 'text-red-500' },
};

const DEFAULT_FORM = {
  title: '',
  category: 'COUNSELING',
  providerName: '',
  contactEmail: '',
  contactPhone: '',
  websiteUrl: '',
  isAnonymous: false,
  description: '',
};

export default function EAPPage() {
  const user = useAuthStore((s) => s.user);
  const isHR = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(user?.role ?? '');

  const [activeCategory, setActiveCategory] = useState<Category>('ALL');
  const { data: resources = [], isLoading } = useEAPResources(
    activeCategory === 'ALL' ? undefined : activeCategory
  );
  const createResource = useCreateEAPResource();
  const updateResource = useUpdateEAPResource();
  const deleteResource = useDeleteEAPResource();

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function openCreate() {
    setEditTarget(null);
    setForm({ ...DEFAULT_FORM });
    setShowForm(true);
  }

  function openEdit(resource: any) {
    setEditTarget(resource);
    setForm({
      title: resource.title ?? '',
      category: resource.category ?? 'COUNSELING',
      providerName: resource.providerName ?? '',
      contactEmail: resource.contactEmail ?? '',
      contactPhone: resource.contactPhone ?? '',
      websiteUrl: resource.websiteUrl ?? '',
      isAnonymous: resource.isAnonymous ?? false,
      description: resource.description ?? '',
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.title || !form.providerName) return;
    const payload = {
      title: form.title,
      category: form.category,
      providerName: form.providerName,
      contactEmail: form.contactEmail || undefined,
      contactPhone: form.contactPhone || undefined,
      websiteUrl: form.websiteUrl || undefined,
      isAnonymous: form.isAnonymous,
      description: form.description || undefined,
    };
    if (editTarget) {
      await updateResource.mutateAsync({ id: editTarget.id, ...payload });
    } else {
      await createResource.mutateAsync(payload);
    }
    setShowForm(false);
    setEditTarget(null);
    setForm({ ...DEFAULT_FORM });
  }

  async function handleDelete(id: string) {
    await deleteResource.mutateAsync(id);
    setConfirmDelete(null);
  }

  const isSaving = createResource.isPending || updateResource.isPending;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100">
            <Heart className="h-5 w-5 text-pink-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Employee Assistance Program</h1>
            <p className="text-sm text-muted-foreground">
              Mental health, wellness, and support resources
            </p>
          </div>
        </div>
        {isHR && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Add Resource
          </Button>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const catMeta = cat !== 'ALL' ? CATEGORY_META[cat] : null;
          const Icon = catMeta?.icon;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {cat === 'ALL' ? 'All' : CATEGORY_META[cat]?.label ?? cat}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Heart className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No resources found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {isHR
              ? 'Add the first EAP resource for employees.'
              : 'No resources available in this category yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((res: any) => {
            const catMeta = CATEGORY_META[res.category];
            const Icon = catMeta?.icon ?? Heart;
            return (
              <Card key={res.id} className="border shadow-sm">
                <CardContent className="pt-4 pb-4 px-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 shrink-0 ${catMeta?.color ?? 'text-muted-foreground'}`} />
                      <div>
                        <p className="font-semibold text-sm leading-tight">{res.title}</p>
                        <p className="text-xs text-muted-foreground">{res.providerName}</p>
                      </div>
                    </div>
                    {isHR && (
                      <div className="flex gap-1 shrink-0">
                        <button
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => openEdit(res)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="text-muted-foreground hover:text-red-500"
                          onClick={() => setConfirmDelete(res.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {res.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {res.description}
                    </p>
                  )}

                  <div className="space-y-1 text-xs text-muted-foreground">
                    {res.contactEmail && (
                      <a
                        href={`mailto:${res.contactEmail}`}
                        className="block hover:text-foreground truncate"
                      >
                        {res.contactEmail}
                      </a>
                    )}
                    {res.contactPhone && (
                      <a
                        href={`tel:${res.contactPhone}`}
                        className="block hover:text-foreground"
                      >
                        {res.contactPhone}
                      </a>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1.5">
                      {res.isAnonymous && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-gray-100 text-gray-600"
                        >
                          Anonymous
                        </Badge>
                      )}
                    </div>
                    {res.websiteUrl && (
                      <a
                        href={res.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        Visit <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Resource' : 'Add EAP Resource'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. 24/7 Counseling Helpline"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category *</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_META).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Provider Name *</Label>
                <Input
                  value={form.providerName}
                  onChange={(e) => setForm((f) => ({ ...f, providerName: e.target.value }))}
                  placeholder="e.g. MindPeace India"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                />
              </div>
              <div>
                <Label>Contact Phone</Label>
                <Input
                  value={form.contactPhone}
                  onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
                  placeholder="e.g. 1800-000-0000"
                />
              </div>
            </div>
            <div>
              <Label>Website URL</Label>
              <Input
                value={form.websiteUrl}
                onChange={(e) => setForm((f) => ({ ...f, websiteUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of the service"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isAnonymous"
                checked={form.isAnonymous}
                onChange={(e) => setForm((f) => ({ ...f, isAnonymous: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isAnonymous" className="cursor-pointer font-normal">
                This service is anonymous / confidential
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!form.title || !form.providerName || isSaving}
            >
              {isSaving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Resource'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Resource</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this resource? Employees will no longer see it.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteResource.isPending}
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
            >
              {deleteResource.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
