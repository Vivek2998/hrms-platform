import { useState } from 'react';
import { Search, Mail, Phone, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDirectory } from '@/hooks/useDirectory';
import type { DirectoryEmployee } from '@/hooks/useDirectory';
import { useDebounce } from '@/hooks/useDebounce';

function Avatar({ name, url, size = 'md' }: { name: string; url?: string | null | undefined; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'h-16 w-16 text-lg' : size === 'sm' ? 'h-8 w-8 text-xs' : 'h-12 w-12 text-sm';
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  if (url) {
    return <img src={url} alt={name} className={`${cls} rounded-full object-cover`} />;
  }
  return (
    <div className={`${cls} bg-primary/10 text-primary flex items-center justify-center rounded-full font-bold`}>
      {initials}
    </div>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function EmployeeCard({ emp, onClick }: { emp: DirectoryEmployee; onClick: () => void }) {
  const name = `${emp.firstName} ${emp.lastName}`;
  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center gap-3 p-5 text-center">
        <Avatar name={name} url={emp.avatarUrl} size="md" />
        <div>
          <p className="font-semibold">{name}</p>
          <p className="text-muted-foreground text-sm">{emp.designation ?? '—'}</p>
          {emp.department && (
            <Badge variant="secondary" className="mt-1 text-xs">
              {emp.department.name}
            </Badge>
          )}
        </div>
        <div className="w-full space-y-1 text-left">
          <p className="text-muted-foreground flex items-center gap-1.5 truncate text-xs">
            <Mail className="h-3 w-3 shrink-0" />
            {emp.workEmail}
          </p>
          {emp.phone && (
            <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Phone className="h-3 w-3 shrink-0" />
              {emp.phone}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmployeeDetailDialog({
  emp,
  onClose,
}: {
  emp: DirectoryEmployee | null;
  onClose: () => void;
}) {
  if (!emp) return null;
  const name = `${emp.firstName} ${emp.lastName}`;

  return (
    <Dialog open={!!emp} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Employee Profile</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-4">
          <Avatar name={name} url={emp.avatarUrl} size="lg" />
          <div>
            <p className="text-lg font-bold">{name}</p>
            <p className="text-muted-foreground">{emp.designation ?? '—'}</p>
            {emp.department && (
              <Badge variant="secondary" className="mt-1">{emp.department.name}</Badge>
            )}
          </div>
        </div>

        <div className="divide-y rounded-lg border">
          <Row label="Employee Code" value={emp.employeeCode} />
          <Row label="Work Email" value={emp.workEmail} />
          {emp.phone && <Row label="Phone" value={emp.phone} />}
          {emp.manager && (
            <Row label="Reports To" value={`${emp.manager.firstName} ${emp.manager.lastName}`} />
          )}
          {emp.dateOfJoining && (
            <Row label="Date of Joining" value={fmtDate(emp.dateOfJoining)} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-4 py-2.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default function DirectoryPage() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<DirectoryEmployee | null>(null);
  const debouncedQuery = useDebounce(query, 300);

  const { data: employees, isLoading } = useDirectory(debouncedQuery || undefined);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Employee Directory</h1>
        <p className="text-muted-foreground">
          {employees ? `${employees.length} employees` : '—'}
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        <Input
          className="pl-9"
          placeholder="Search by name, designation, code…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); }}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-full rounded-xl" />
          ))}
        </div>
      ) : employees?.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16">
          <MapPin className="text-muted-foreground h-10 w-10" />
          <p className="text-muted-foreground text-sm">No employees found.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {employees?.map((emp) => (
            <EmployeeCard
              key={emp.id}
              emp={emp}
              onClick={() => { setSelected(emp); }}
            />
          ))}
        </div>
      )}

      <EmployeeDetailDialog emp={selected} onClose={() => { setSelected(null); }} />
    </div>
  );
}
