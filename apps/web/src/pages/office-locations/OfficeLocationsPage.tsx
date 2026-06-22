import { useState } from 'react';
import { Plus, Pencil, Trash2, MapPin, Users, Navigation } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
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
  useOfficeLocations,
  useCreateOfficeLocation,
  useUpdateOfficeLocation,
  useDeleteOfficeLocation,
  useAssignEmployeeLocation,
  type OfficeLocation,
} from '@/hooks/useOfficeLocations';
import { useEmployees } from '@/hooks/useEmployees';
import { useAuthStore } from '@/stores/auth.store';

// ── Form schema ────────────────────────────────────────────────────────────────

const locationSchema = z.object({
  name: z.string().min(1, 'Required').max(100),
  address: z.string().optional(),
  latitude: z.coerce
    .number({ invalid_type_error: 'Must be a number' })
    .min(-90, 'Must be between -90 and 90')
    .max(90, 'Must be between -90 and 90'),
  longitude: z.coerce
    .number({ invalid_type_error: 'Must be a number' })
    .min(-180, 'Must be between -180 and 180')
    .max(180, 'Must be between -180 and 180'),
  radiusMeters: z.coerce
    .number({ invalid_type_error: 'Must be a number' })
    .int()
    .min(10, 'Minimum 10 m')
    .max(5000, 'Maximum 5000 m'),
  isActive: z.boolean(),
});

type LocationForm = z.infer<typeof locationSchema>;

// ── Add / Edit dialog ─────────────────────────────────────────────────────────

function LocationDialog({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing?: OfficeLocation;
}) {
  const createMutation = useCreateOfficeLocation();
  const updateMutation = useUpdateOfficeLocation(editing?.id ?? '');
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<LocationForm>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: editing?.name ?? '',
      address: editing?.address ?? '',
      latitude: editing?.latitude ?? 0,
      longitude: editing?.longitude ?? 0,
      radiusMeters: editing?.radiusMeters ?? 100,
      isActive: editing?.isActive ?? true,
    },
    ...(editing
      ? {
          values: {
            name: editing.name,
            address: editing.address ?? '',
            latitude: editing.latitude,
            longitude: editing.longitude,
            radiusMeters: editing.radiusMeters,
            isActive: editing.isActive,
          },
        }
      : {}),
  });

  const onSubmit = (data: LocationForm) => {
    const payload = {
      name: data.name,
      ...(data.address ? { address: data.address } : {}),
      latitude: data.latitude,
      longitude: data.longitude,
      radiusMeters: data.radiusMeters,
      isActive: data.isActive,
    };

    if (editing) {
      updateMutation.mutate(payload, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Office Location' : 'Add Office Location'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label className="mb-1.5 block">
              Location Name <span className="text-destructive">*</span>
            </Label>
            <Input placeholder="e.g. Bangalore HQ" {...form.register('name')} />
            {form.formState.errors.name && (
              <p className="text-destructive mt-1 text-xs">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <Label className="mb-1.5 block">Address</Label>
            <Input placeholder="Full office address (optional)" {...form.register('address')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block">
                Latitude <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                step="any"
                placeholder="e.g. 12.9716"
                {...form.register('latitude')}
              />
              {form.formState.errors.latitude && (
                <p className="text-destructive mt-1 text-xs">
                  {form.formState.errors.latitude.message}
                </p>
              )}
            </div>
            <div>
              <Label className="mb-1.5 block">
                Longitude <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                step="any"
                placeholder="e.g. 77.5946"
                {...form.register('longitude')}
              />
              {form.formState.errors.longitude && (
                <p className="text-destructive mt-1 text-xs">
                  {form.formState.errors.longitude.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block">
              Geofence Radius (meters) <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              placeholder="100"
              {...form.register('radiusMeters')}
            />
            <p className="text-muted-foreground mt-1 text-xs">
              Employees within this radius will get a smart punch-in notification. Min 10 m.
            </p>
            {form.formState.errors.radiusMeters && (
              <p className="text-destructive mt-1 text-xs">
                {form.formState.errors.radiusMeters.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-muted-foreground text-xs">
                Inactive locations won't trigger smart punch-in
              </p>
            </div>
            <Switch
              checked={form.watch('isActive')}
              onCheckedChange={(val: boolean) => form.setValue('isActive', val)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : editing ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Assign employees dialog ───────────────────────────────────────────────────

type EmpRow = {
  id: string;
  firstName: string;
  lastName: string;
  designation?: string;
  employeeCode: string;
  role: string;
  officeLocationId?: string;
  officeLocation?: { id: string; name: string };
};

function AssignDialog({
  location,
  onClose,
}: {
  location: OfficeLocation;
  onClose: () => void;
}) {
  const { data, isLoading } = useEmployees({ limit: 500 });
  const assignMutation = useAssignEmployeeLocation();
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [optimistic, setOptimistic] = useState<Map<string, string | null>>(new Map());
  const currentUser = useAuthStore((s) => s.user);

  const empList = (data?.employees ?? []) as EmpRow[];

  // Filter to only employees this admin is allowed to assign
  const assignableList = empList.filter((emp) => {
    if (!currentUser) return false;
    if (currentUser.role === 'SUPER_ADMIN') return true;
    if (currentUser.role === 'ORG_ADMIN') {
      return emp.id !== currentUser.id && (emp.role === 'HR' || emp.role === 'EMPLOYEE');
    }
    if (currentUser.role === 'HR') {
      return emp.id !== currentUser.id && emp.role === 'EMPLOYEE';
    }
    return false;
  });

  const effectiveLocationId = (emp: EmpRow): string | null | undefined =>
    optimistic.has(emp.id) ? optimistic.get(emp.id) : emp.officeLocationId;

  const handleToggle = async (emp: EmpRow) => {
    const current = effectiveLocationId(emp);
    const newLocationId = current === location.id ? null : location.id;

    setOptimistic((prev) => new Map(prev).set(emp.id, newLocationId));
    setPendingIds((prev) => new Set(prev).add(emp.id));

    try {
      await assignMutation.mutateAsync({ employeeId: emp.id, locationId: newLocationId });
    } catch {
      setOptimistic((prev) => {
        const next = new Map(prev);
        next.delete(emp.id);
        return next;
      });
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(emp.id);
        return next;
      });
    }
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Employees — {location.name}</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">
          Toggle employees to assign or unassign them from this location. Employees assigned here
          will get smart punch-in notifications when nearby.
        </p>

        <div className="max-h-[400px] overflow-y-auto rounded-lg border">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : assignableList.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">No employees found.</p>
          ) : (
            <div className="divide-y">
              {assignableList.map((emp) => {
                const effLocId = effectiveLocationId(emp);
                const isAssignedHere = effLocId === location.id;
                const isAssignedElsewhere = effLocId && effLocId !== location.id;
                const locationName = optimistic.has(emp.id)
                  ? isAssignedHere ? location.name : undefined
                  : emp.officeLocation?.name;

                return (
                  <div key={emp.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
                      <span className="text-primary text-xs font-semibold">
                        {emp.firstName[0]}{emp.lastName[0]}
                      </span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-sm font-medium">
                        {emp.firstName} {emp.lastName}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {emp.designation ?? emp.employeeCode}
                        {isAssignedElsewhere && locationName && (
                          <span className="text-amber-600"> · assigned to {locationName}</span>
                        )}
                      </p>
                    </div>
                    <Switch
                      checked={isAssignedHere}
                      disabled={pendingIds.has(emp.id)}
                      onCheckedChange={() => { void handleToggle(emp); }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function OfficeLocationsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<OfficeLocation | undefined>();
  const [assigning, setAssigning] = useState<OfficeLocation | undefined>();
  const [deleting, setDeleting] = useState<OfficeLocation | undefined>();

  const { data: locations = [], isLoading } = useOfficeLocations();
  const deleteMutation = useDeleteOfficeLocation();

  const confirmDelete = () => {
    if (!deleting) return;
    deleteMutation.mutate(deleting.id, { onSuccess: () => setDeleting(undefined) });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Office Locations</h1>
          <p className="text-muted-foreground">
            {isLoading ? '—' : locations.length} location{locations.length !== 1 ? 's' : ''} ·
            Manage geofence zones for smart punch-in
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" />
          Add Location
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Locations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : locations.length === 0 ? (
            <div className="py-16 text-center">
              <MapPin className="text-muted-foreground mx-auto mb-3 h-10 w-10 opacity-40" />
              <p className="text-muted-foreground text-sm">
                No office locations yet. Add your first location to enable smart punch-in.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {locations.map((loc) => (
                <div key={loc.id} className="flex flex-wrap items-start gap-4 px-6 py-5">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      loc.isActive ? 'bg-primary/10' : 'bg-muted'
                    }`}
                  >
                    <Navigation
                      className={`h-5 w-5 ${loc.isActive ? 'text-primary' : 'text-muted-foreground'}`}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{loc.name}</p>
                      <Badge variant={loc.isActive ? 'default' : 'secondary'}>
                        {loc.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline" className="gap-1 text-xs">
                        <Navigation className="h-3 w-3" />
                        {loc.radiusMeters} m radius
                      </Badge>
                    </div>
                    {loc.address && (
                      <p className="text-muted-foreground mt-0.5 text-xs">{loc.address}</p>
                    )}
                    <p className="text-muted-foreground mt-1 text-xs font-mono">
                      {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAssigning(loc)}
                      className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors hover:border-foreground/30"
                    >
                      <Users className="h-3.5 w-3.5" />
                      {loc._count?.employees ?? 0} employees
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditing(loc)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive h-8 w-8"
                      onClick={() => setDeleting(loc)}
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

      {/* Add dialog */}
      <LocationDialog open={showAdd} onClose={() => setShowAdd(false)} />

      {/* Edit dialog */}
      {editing && (
        <LocationDialog
          open
          editing={editing}
          onClose={() => setEditing(undefined)}
        />
      )}

      {/* Assign employees dialog */}
      {assigning && (
        <AssignDialog location={assigning} onClose={() => setAssigning(undefined)} />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => { if (!o) setDeleting(undefined); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the office location. Employees assigned here will be
              unassigned, and their smart punch-in will stop working.
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
