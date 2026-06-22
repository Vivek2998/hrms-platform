import { useState } from 'react';
import { Plus, Trash2, CalendarRange } from 'lucide-react';
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
import { useHolidays, useCreateHoliday, useDeleteHoliday } from '@/hooks/useHolidays';
import { useAuthStore } from '@/stores/auth.store';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const TYPE_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'warning' }> = {
  NATIONAL: { label: 'National', variant: 'default' },
  REGIONAL: { label: 'Regional', variant: 'secondary' },
  OPTIONAL: { label: 'Optional', variant: 'warning' },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [currentYear - 1, currentYear, currentYear + 1];

export default function HolidaysPage() {
  const role = useAuthStore((s) => s.user?.role);
  const isHR = role && ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(role);

  const [year, setYear] = useState(currentYear);
  const [showAdd, setShowAdd] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({ name: '', date: '', type: 'NATIONAL' as const });

  const { data: holidays, isLoading } = useHolidays(year);
  const createHoliday = useCreateHoliday(year);
  const deleteHoliday = useDeleteHoliday(year);

  // Group by month
  const byMonth = MONTHS.map((month, idx) => ({
    month,
    holidays: (holidays ?? []).filter(
      (h) => new Date(h.date).getUTCMonth() === idx,
    ),
  })).filter((g) => g.holidays.length > 0);

  function handleAdd() {
    if (!form.name.trim() || !form.date) return;
    createHoliday.mutate(
      { name: form.name.trim(), date: form.date, type: form.type as 'NATIONAL' | 'REGIONAL' | 'OPTIONAL' },
      { onSuccess: () => { setForm({ name: '', date: '', type: 'NATIONAL' }); setShowAdd(false); } },
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Holiday Calendar</h1>
          <p className="text-muted-foreground">
            {holidays?.length ?? '—'} holidays in {year}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={String(year)}
            onValueChange={(v) => { setYear(Number(v)); }}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEAR_OPTIONS.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isHR && (
            <Button onClick={() => { setShowAdd(true); }}>
              <Plus className="h-4 w-4" />
              Add Holiday
            </Button>
          )}
        </div>
      </div>

      {/* Summary badges */}
      <div className="flex flex-wrap gap-3">
        {(['NATIONAL', 'REGIONAL', 'OPTIONAL'] as const).map((type) => {
          const count = (holidays ?? []).filter((h) => h.type === type).length;
          return (
            <div key={type} className="bg-muted/40 flex items-center gap-2 rounded-lg border px-4 py-2">
              <Badge variant={(TYPE_LABELS[type]?.variant ?? 'secondary') as 'default' | 'secondary'}>{TYPE_LABELS[type]?.label ?? type}</Badge>
              <span className="text-sm font-medium">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Holiday list grouped by month */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : byMonth.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16">
            <CalendarRange className="text-muted-foreground h-12 w-12" />
            <p className="text-muted-foreground text-sm">
              No holidays added for {year} yet.
            </p>
            {isHR && (
              <Button onClick={() => { setShowAdd(true); }}>
                <Plus className="h-4 w-4" />
                Add Holiday
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {byMonth.map(({ month, holidays: mh }) => (
            <Card key={month}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{month}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {mh.map((h) => (
                    <div key={h.id} className="flex items-center justify-between px-6 py-3">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 text-primary flex h-10 w-10 flex-col items-center justify-center rounded-lg text-xs font-bold">
                          <span className="text-base leading-none">
                            {new Date(h.date).getUTCDate()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{h.name}</p>
                          <p className="text-muted-foreground text-xs">{fmtDate(h.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={(TYPE_LABELS[h.type]?.variant ?? 'secondary') as 'default' | 'secondary'}>
                          {TYPE_LABELS[h.type]?.label ?? h.type}
                        </Badge>
                        {isHR && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                            onClick={() => { setDeletingId(h.id); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Holiday Dialog */}
      <Dialog open={showAdd} onOpenChange={(o) => { if (!o) setShowAdd(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Holiday</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Holiday Name</Label>
              <Input
                placeholder="e.g. Diwali"
                value={form.name}
                onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); }}
              />
            </div>
            <div className="space-y-1">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => { setForm((f) => ({ ...f, date: e.target.value })); }}
              />
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => { setForm((f) => ({ ...f, type: v as typeof form.type })); }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NATIONAL">National</SelectItem>
                  <SelectItem value="REGIONAL">Regional</SelectItem>
                  <SelectItem value="OPTIONAL">Optional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); }}>Cancel</Button>
            <Button
              onClick={handleAdd}
              disabled={createHoliday.isPending || !form.name.trim() || !form.date}
            >
              {createHoliday.isPending ? 'Adding…' : 'Add Holiday'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deletingId} onOpenChange={(o) => { if (!o) setDeletingId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove Holiday</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Are you sure you want to remove this holiday? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeletingId(null); }}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteHoliday.isPending}
              onClick={() => {
                if (deletingId) {
                  deleteHoliday.mutate(deletingId, { onSuccess: () => { setDeletingId(null); } });
                }
              }}
            >
              {deleteHoliday.isPending ? 'Removing…' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
