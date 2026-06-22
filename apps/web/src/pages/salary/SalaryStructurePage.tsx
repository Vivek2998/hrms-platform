import { useState } from 'react';
import { Plus, Pencil, Trash2, Info } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import {
  useSalaryComponents,
  useCreateSalaryComponent,
  useUpdateSalaryComponent,
  useDeleteSalaryComponent,
  type SalaryComponent,
} from '@/hooks/useSalary';

const TYPE_VARIANTS: Record<string, 'success' | 'destructive' | 'secondary'> = {
  EARNING: 'success',
  DEDUCTION: 'destructive',
  STATUTORY: 'secondary',
};

const schema = z.object({
  name: z.string().min(1, 'Required').max(100),
  code: z.string().min(1, 'Required').max(20),
  type: z.enum(['EARNING', 'DEDUCTION', 'STATUTORY']),
  isFixedAmount: z.boolean(),
  defaultPercent: z.coerce.number().min(0).max(100).optional(),
  defaultAmount: z.coerce.number().min(0).optional(),
  isTaxable: z.boolean(),
  displayOrder: z.coerce.number().int().min(0).optional(),
});

type FormValues = z.infer<typeof schema>;

function blankForm(): FormValues {
  return { name: '', code: '', type: 'EARNING', isFixedAmount: false, isTaxable: true, displayOrder: 0 };
}

function fromComponent(c: SalaryComponent): FormValues {
  return {
    name: c.name,
    code: c.code,
    type: c.type,
    isFixedAmount: c.isFixedAmount,
    defaultPercent: c.defaultPercent ?? undefined,
    defaultAmount: c.defaultAmount ?? undefined,
    isTaxable: c.isTaxable,
    displayOrder: c.displayOrder,
  };
}

function ComponentDialog({
  open,
  editing,
  onClose,
}: {
  open: boolean;
  editing: SalaryComponent | null;
  onClose: () => void;
}) {
  const create = useCreateSalaryComponent();
  const update = useUpdateSalaryComponent();
  const isPending = create.isPending || update.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: editing ? fromComponent(editing) : blankForm(),
  });

  const isFixed = form.watch('isFixedAmount');

  function handleClose() { form.reset(); onClose(); }

  function onSubmit(values: FormValues) {
    const { defaultPercent, defaultAmount, displayOrder, ...required } = values;
    const payload = {
      ...required,
      ...(defaultPercent !== undefined ? { defaultPercent } : {}),
      ...(defaultAmount !== undefined ? { defaultAmount } : {}),
      ...(displayOrder !== undefined ? { displayOrder } : {}),
    };
    if (editing) {
      update.mutate({ id: editing.id, ...payload }, { onSuccess: handleClose });
    } else {
      create.mutate(payload, { onSuccess: handleClose });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Component' : 'Add Salary Component'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Component Name *</Label>
              <Input placeholder="e.g. Basic Salary" {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Code *</Label>
              <Input
                placeholder="e.g. BASIC"
                {...form.register('code')}
                onChange={(e) => form.setValue('code', e.target.value.toUpperCase())}
              />
              {form.formState.errors.code && (
                <p className="text-destructive text-xs">{form.formState.errors.code.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Type *</Label>
              <Select
                value={form.watch('type')}
                onValueChange={(v) => form.setValue('type', v as FormValues['type'])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EARNING">Earning</SelectItem>
                  <SelectItem value="DEDUCTION">Deduction</SelectItem>
                  <SelectItem value="STATUTORY">Statutory</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Value Type</Label>
              <Select
                value={isFixed ? 'fixed' : 'percent'}
                onValueChange={(v) => form.setValue('isFixedAmount', v === 'fixed')}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">% of Basic</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isFixed ? (
            <div className="space-y-1">
              <Label>Default Amount (₹/month)</Label>
              <Input type="number" min={0} placeholder="e.g. 5000" {...form.register('defaultAmount')} />
            </div>
          ) : (
            <div className="space-y-1">
              <Label>Default % of Basic</Label>
              <Input type="number" min={0} max={100} step={0.01} placeholder="e.g. 50" {...form.register('defaultPercent')} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Taxable</Label>
              <Select
                value={form.watch('isTaxable') ? 'yes' : 'no'}
                onValueChange={(v) => form.setValue('isTaxable', v === 'yes')}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Taxable</SelectItem>
                  <SelectItem value="no">Non-taxable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Display Order</Label>
              <Input type="number" min={0} {...form.register('displayOrder')} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : editing ? 'Save Changes' : 'Add Component'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ComponentRow({
  c,
  onEdit,
  onDelete,
}: {
  c: SalaryComponent;
  onEdit: (c: SalaryComponent) => void;
  onDelete: (c: SalaryComponent) => void;
}) {
  return (
    <tr className="hover:bg-muted/30 border-b last:border-0">
      <td className="px-4 py-2.5">
        <p className="text-sm font-medium">{c.name}</p>
        <p className="text-muted-foreground font-mono text-xs">{c.code}</p>
      </td>
      <td className="text-muted-foreground px-4 py-2.5 text-sm">
        {c.isFixedAmount
          ? c.defaultAmount != null ? `₹${c.defaultAmount.toLocaleString('en-IN')}/mo` : 'Fixed'
          : c.defaultPercent != null ? `${c.defaultPercent}% of Basic` : 'Variable %'}
      </td>
      <td className="px-4 py-2.5">
        <Badge variant={c.isTaxable ? 'secondary' : 'outline'} className="text-xs">
          {c.isTaxable ? 'Taxable' : 'Non-taxable'}
        </Badge>
      </td>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(c)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon" variant="ghost"
            className="text-destructive hover:text-destructive h-7 w-7"
            onClick={() => onDelete(c)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

function Section({
  type,
  items,
  onEdit,
  onDelete,
}: {
  type: string;
  items: SalaryComponent[];
  onEdit: (c: SalaryComponent) => void;
  onDelete: (c: SalaryComponent) => void;
}) {
  if (items.length === 0) return null;
  const labels: Record<string, string> = { EARNING: 'Earnings', DEDUCTION: 'Deductions', STATUTORY: 'Statutory' };
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Badge variant={TYPE_VARIANTS[type]}>{labels[type]}</Badge>
        <span className="text-muted-foreground text-xs">{items.length} component{items.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 border-b text-left text-xs font-medium text-muted-foreground">
              <th className="px-4 py-2.5">Component</th>
              <th className="px-4 py-2.5">Default Value</th>
              <th className="px-4 py-2.5">Tax</th>
              <th className="px-4 py-2.5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => <ComponentRow key={c.id} c={c} onEdit={onEdit} onDelete={onDelete} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function SalaryStructurePage() {
  const { data: components = [], isLoading } = useSalaryComponents();
  const deleteComponent = useDeleteSalaryComponent();
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<SalaryComponent | null>(null);
  const [deleting, setDeleting] = useState<SalaryComponent | null>(null);

  const earnings = components.filter((c) => c.type === 'EARNING');
  const deductions = components.filter((c) => c.type === 'DEDUCTION');
  const statutory = components.filter((c) => c.type === 'STATUTORY');

  function openAdd() { setEditing(null); setShowDialog(true); }
  function openEdit(c: SalaryComponent) { setEditing(c); setShowDialog(true); }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Salary Structure</h1>
          <p className="text-muted-foreground text-sm">
            Define the earning and deduction components used when assigning employee salaries.
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add Component
        </Button>
      </div>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="flex gap-3 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <p className="text-xs text-blue-800">
            Components define your salary structure. When setting an employee&apos;s salary from
            their profile, the CTC breakdown is auto-calculated. These defaults serve as reference —
            individual employee amounts can always be adjusted.
          </p>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : components.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No components yet</CardTitle>
            <CardDescription>
              Add your first salary component. Common ones: Basic Salary (40% of CTC), HRA (50% of Basic),
              LTA, Special Allowance, PF, ESI.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Add First Component
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Section type="EARNING" items={earnings} onEdit={openEdit} onDelete={setDeleting} />
          <Section type="DEDUCTION" items={deductions} onEdit={openEdit} onDelete={setDeleting} />
          <Section type="STATUTORY" items={statutory} onEdit={openEdit} onDelete={setDeleting} />
        </div>
      )}

      <ComponentDialog open={showDialog} editing={editing} onClose={() => setShowDialog(false)} />

      <AlertDialog open={!!deleting} onOpenChange={(o) => { if (!o) setDeleting(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove component?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleting?.name}&rdquo; will be removed. Existing payslips that already use
              this component are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (deleting) deleteComponent.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
