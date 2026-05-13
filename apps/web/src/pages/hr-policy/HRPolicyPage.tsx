import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookOpen, Download, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuthStore } from '@/stores/auth.store';
import { usePolicies, useCreatePolicy, useDeletePolicy } from '@/hooks/usePolicies';
import type { HrPolicy, PolicyCategory } from '@/hooks/usePolicies';

const CATEGORIES: { value: PolicyCategory; label: string }[] = [
  { value: 'GENERAL', label: 'General' },
  { value: 'LEAVE', label: 'Leave Policy' },
  { value: 'CODE_OF_CONDUCT', label: 'Code of Conduct' },
  { value: 'BENEFITS', label: 'Benefits' },
  { value: 'SAFETY', label: 'Safety' },
  { value: 'OTHER', label: 'Other' },
];

const createSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().optional(),
  fileUrl: z.string().url('Please enter a valid file URL'),
  category: z.enum(['GENERAL', 'LEAVE', 'CODE_OF_CONDUCT', 'BENEFITS', 'SAFETY', 'OTHER']),
  version: z.string().optional(),
});
type CreateInput = z.infer<typeof createSchema>;

function fmtBytes(bytes?: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function UploadDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { mutate, isPending } = useCreatePolicy();
  const form = useForm<CreateInput>({
    resolver: zodResolver(createSchema),
    defaultValues: { title: '', description: '', fileUrl: '', category: 'GENERAL', version: '' },
  });

  function onSubmit(data: CreateInput) {
    mutate(
      {
        title: data.title,
        fileUrl: data.fileUrl,
        category: data.category,
        ...(data.description ? { description: data.description } : {}),
        ...(data.version ? { version: data.version } : {}),
      },
      {
        onSuccess: () => {
          toast.success('Policy uploaded');
          form.reset();
          onClose();
        },
        onError: () => toast.error('Failed to upload policy'),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload HR Policy</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input placeholder="e.g. Work From Home Policy" {...form.register('title')} />
            {form.formState.errors.title && (
              <p className="text-destructive text-xs">{form.formState.errors.title.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea rows={2} placeholder="Brief description of this policy" {...form.register('description')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={form.watch('category')}
                onValueChange={(v) => { form.setValue('category', v as PolicyCategory); }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Version (optional)</Label>
              <Input placeholder="e.g. v2.0" {...form.register('version')} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>File URL</Label>
            <Input
              placeholder="Paste Cloudinary or file URL"
              type="url"
              {...form.register('fileUrl')}
            />
            {form.formState.errors.fileUrl && (
              <p className="text-destructive text-xs">{form.formState.errors.fileUrl.message}</p>
            )}
            <p className="text-muted-foreground text-xs">
              Upload your file via the Documents section first, then paste the URL here.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Upload
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PolicyCard({ policy, isHR }: { policy: HrPolicy; isHR: boolean }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { mutate: deletePolicy, isPending } = useDeletePolicy();
  const cat = CATEGORIES.find((c) => c.value === policy.category);

  return (
    <>
      <Card className="transition-shadow hover:shadow-sm">
        <CardContent className="flex items-start gap-4 p-5">
          <div className="bg-primary/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
            <BookOpen className="text-primary h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start gap-2">
              <p className="font-semibold">{policy.title}</p>
              <Badge variant="secondary" className="text-xs">{cat?.label ?? policy.category}</Badge>
              {policy.version && (
                <Badge variant="outline" className="text-xs">{policy.version}</Badge>
              )}
            </div>
            {policy.description && (
              <p className="text-muted-foreground mt-1 text-sm">{policy.description}</p>
            )}
            <p className="text-muted-foreground mt-1 text-xs">
              {fmtBytes(policy.fileSize)}
              {policy.fileSize ? ' · ' : ''}
              Added {new Date(policy.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={policy.fileUrl} target="_blank" rel="noreferrer">
                <Download className="mr-1 h-3.5 w-3.5" />
                Download
              </a>
            </Button>
            {isHR && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => { setConfirmDelete(true); }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this policy?</AlertDialogTitle>
            <AlertDialogDescription>
              "{policy.title}" will no longer be visible to employees.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                deletePolicy(policy.id, {
                  onSuccess: () => { toast.success('Policy archived'); setConfirmDelete(false); },
                  onError: () => toast.error('Failed to archive policy'),
                });
              }}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Archive'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function HRPolicyPage() {
  const role = useAuthStore((s) => s.user?.role);
  const isHR = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(role ?? '');
  const [showUpload, setShowUpload] = useState(false);
  const { data: policies, isLoading } = usePolicies();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">HR Policies</h1>
          <p className="text-muted-foreground">Company policies and guidelines</p>
        </div>
        {isHR && (
          <Button onClick={() => { setShowUpload(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Upload Policy
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-muted h-24 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : policies?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16">
            <BookOpen className="text-muted-foreground h-12 w-12" />
            <p className="text-muted-foreground text-sm">No policies uploaded yet.</p>
            {isHR && (
              <Button onClick={() => { setShowUpload(true); }}>Upload first policy</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {policies?.map((p) => (
            <PolicyCard key={p.id} policy={p} isHR={isHR} />
          ))}
        </div>
      )}

      <UploadDialog open={showUpload} onClose={() => { setShowUpload(false); }} />
    </div>
  );
}
