import { useState } from 'react';
import { Fingerprint, Plus, Trash2, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useBiometricDevices,
  useDeviceLogs,
  useCreateDevice,
  useDeleteDevice,
} from '@/hooks/useBiometricDevices';
import { useAuthStore } from '@/stores/auth.store';
import { format } from 'date-fns';

const VENDORS = ['ZKTECO', 'ESSL', 'OTHER'] as const;

type DeviceForm = {
  name: string;
  vendor: string;
  ipAddress: string;
  location: string;
  port: string;
};

const DEFAULT_FORM: DeviceForm = {
  name: '',
  vendor: 'ZKTECO',
  ipAddress: '',
  location: '',
  port: '4370',
};

export default function BiometricDevicesPage() {
  const user = useAuthStore((s) => s.user);
  const isHR = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(user?.role ?? '');

  const { data: devices = [], isLoading } = useBiometricDevices();
  const createDevice = useCreateDevice();
  const deleteDevice = useDeleteDevice();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<DeviceForm>(DEFAULT_FORM);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data: logs = [], isLoading: logsLoading } = useDeviceLogs(selectedId);

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
    if (!form.name || !form.ipAddress) return;
    await createDevice.mutateAsync({
      name: form.name,
      vendor: form.vendor,
      ipAddress: form.ipAddress,
      location: form.location || undefined,
      port: form.port ? Number(form.port) : undefined,
    });
    setForm(DEFAULT_FORM);
    setShowAdd(false);
  }

  async function handleDelete(id: string) {
    await deleteDevice.mutateAsync(id);
    if (selectedId === id) setSelectedId(null);
    setConfirmDelete(null);
  }

  const selectedDevice = devices.find((d: any) => d.id === selectedId);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <Fingerprint className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Biometric Devices</h1>
            <p className="text-sm text-muted-foreground">
              Manage attendance capture hardware
            </p>
          </div>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Device
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device list */}
        <div className="space-y-3 lg:col-span-1">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))
          ) : devices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Fingerprint className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">No devices registered</p>
            </div>
          ) : (
            devices.map((device: any) => (
              <Card
                key={device.id}
                className={`cursor-pointer transition-colors ${
                  selectedId === device.id
                    ? 'border-primary ring-1 ring-primary'
                    : 'hover:border-muted-foreground/40'
                }`}
                onClick={() => setSelectedId(device.id === selectedId ? null : device.id)}
              >
                <CardContent className="pt-3 pb-3 px-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate">{device.name}</p>
                        {device.isActive ? (
                          <Wifi className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        ) : (
                          <WifiOff className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {device.vendor} · {device.ipAddress}
                      </p>
                      {device.location && (
                        <p className="text-xs text-muted-foreground">{device.location}</p>
                      )}
                      {device.lastSyncAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Last sync: {format(new Date(device.lastSyncAt), 'dd MMM yyyy HH:mm')}
                        </p>
                      )}
                    </div>
                    <button
                      className="ml-2 text-muted-foreground hover:text-red-500 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(device.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2">
                    <Badge
                      variant="outline"
                      className={
                        device.isActive
                          ? 'bg-green-100 text-green-700 text-xs'
                          : 'bg-gray-100 text-gray-500 text-xs'
                      }
                    >
                      {device.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Logs panel */}
        <div className="lg:col-span-2">
          {!selectedId ? (
            <div className="flex flex-col items-center justify-center h-48 text-center rounded-lg border border-dashed bg-muted/20">
              <Fingerprint className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Select a device to view its logs
              </p>
            </div>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Logs — {selectedDevice?.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    No logs available for this device.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b">
                        <tr>
                          <th className="pb-2 text-left font-medium text-muted-foreground">Employee ID</th>
                          <th className="pb-2 text-left font-medium text-muted-foreground">Event</th>
                          <th className="pb-2 text-left font-medium text-muted-foreground">Device Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {logs.map((log: any) => (
                          <tr key={log.id} className="hover:bg-muted/20">
                            <td className="py-2 font-mono text-xs">{log.employeeId}</td>
                            <td className="py-2">
                              <Badge
                                variant="outline"
                                className={
                                  log.eventType === 'CHECK_IN'
                                    ? 'bg-green-100 text-green-700 text-xs'
                                    : 'bg-blue-100 text-blue-700 text-xs'
                                }
                              >
                                {log.eventType}
                              </Badge>
                            </td>
                            <td className="py-2 text-muted-foreground">
                              {format(new Date(log.deviceTime), 'dd MMM yyyy HH:mm:ss')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Device Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Biometric Device</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Device Name *</Label>
              <Input
                placeholder="e.g. Main Gate Reader"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Vendor *</Label>
              <Select
                value={form.vendor}
                onValueChange={(v) => setForm((f) => ({ ...f, vendor: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VENDORS.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>IP Address *</Label>
                <Input
                  placeholder="192.168.1.100"
                  value={form.ipAddress}
                  onChange={(e) => setForm((f) => ({ ...f, ipAddress: e.target.value }))}
                />
              </div>
              <div>
                <Label>Port</Label>
                <Input
                  type="number"
                  placeholder="4370"
                  value={form.port}
                  onChange={(e) => setForm((f) => ({ ...f, port: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Location</Label>
              <Input
                placeholder="e.g. Ground Floor Lobby"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!form.name || !form.ipAddress || createDevice.isPending}
            >
              {createDevice.isPending ? 'Adding…' : 'Add Device'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Device</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this device? This action cannot be undone and will remove all associated logs.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteDevice.isPending}
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
            >
              {deleteDevice.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
