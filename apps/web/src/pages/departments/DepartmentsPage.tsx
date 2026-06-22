import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import {
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  type Department,
} from '@/hooks/useDepartments';

const deptSchema = z.object({
  name: z.string().min(1, 'Required').max(100),
  code: z.string().min(1, 'Required').max(20),
  description: z.string().optional(),
});

type DeptForm = z.infer<typeof deptSchema>;

function DeptDialog({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing?: Department;
}) {
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment(editing?.id ?? '');
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<DeptForm>({
    resolver: zodResolver(deptSchema),
    defaultValues: {
      name: editing?.name ?? '',
      code: editing?.code ?? '',
      description: editing?.description ?? '',
    },
    ...(editing ? {
      values: { name: editing.name, code: editing.code, description: editing.description ?? '' },
    } : {}),
  });

  const onSubmit = (data: DeptForm) => {
    const { description, ...required } = data;
    const payload = { ...required, code: required.code.toUpperCase(), ...(description ? { description } : {}) };
    if (editing) {
      updateMutation.mutate(payload, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Department' : 'Add Department'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label className="mb-1.5 block">
              Department Name <span className="text-destructive">*</span>
            </Label>
            <Input placeholder="e.g. Engineering" {...form.register('name')} />
            {form.formState.errors.name && (
              <p className="text-destructive mt-1 text-xs">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div>
            <Label className="mb-1.5 block">
              Code <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="e.g. ENG"
              {...form.register('code')}
              className="uppercase"
            />
            {form.formState.errors.code && (
              <p className="text-destructive mt-1 text-xs">{form.formState.errors.code.message}</p>
            )}
          </div>
          <div>
            <Label className="mb-1.5 block">Description</Label>
            <Input placeholder="Optional description" {...form.register('description')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : editing ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function DepartmentsPage() {
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Department | undefined>();
  const [deleting, setDeleting] = useState<Department | undefined>();

  const { data: departments = [], isLoading } = useDepartments(search ? { search } : {});
  const deleteMutation = useDeleteDepartment();

  const confirmDelete = () => {
    if (!deleting) return;
    deleteMutation.mutate(deleting.id, { onSuccess: () => { setDeleting(undefined); } });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Departments</h1>
          <p className="text-muted-foreground">
            {isLoading ? '—' : departments.length} department{departments.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => { setShowAdd(true); }}>
          <Plus className="h-4 w-4" />
          Add Department
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search departments..."
          className="pl-9"
          value={search}
          onChange={(e) => { setSearch(e.target.value); }}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Departments</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : departments.length === 0 ? (
            <p className="text-muted-foreground py-12 text-center text-sm">
              No departments found. Add your first department to get started.
            </p>
          ) : (
            <div className="divide-y">
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  className="flex items-center gap-4 px-6 py-4"
                >
                  <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                    <span className="text-primary text-xs font-bold">{dept.code.slice(0, 3)}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{dept.name}</p>
                    {dept.description && (
                      <p className="text-muted-foreground text-xs">{dept.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {dept._count !== undefined && (
                      <Badge variant="secondary" className="gap-1">
                        <Users className="h-3 w-3" />
                        {dept._count.employees}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => { setEditing(dept); }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive h-8 w-8"
                      onClick={() => { setDeleting(dept); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DeptDialog open={showAdd} onClose={() => { setShowAdd(false); }} />
      {editing && (
        <DeptDialog
          open={true}
          editing={editing}
          onClose={() => { setEditing(undefined); }}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => { if (!o) setDeleting(undefined); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the department. Employees currently in this department will not
              be removed but will no longer be linked to an active department.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white"
              onClick={confirmDelete}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
