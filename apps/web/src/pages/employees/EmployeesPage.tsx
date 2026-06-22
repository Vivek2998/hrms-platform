import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useEmployees } from '@/hooks/useEmployees';
import { AddEmployeeDialog } from '@/components/employees/AddEmployeeDialog';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';

export default function EmployeesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const { data, isLoading, isError, refetch } = useEmployees({ search, limit: 20 });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-muted-foreground">{data?.meta.total ?? '—'} total employees</p>
        </div>
        <Button onClick={() => { setShowAdd(true); }}>
          <Plus className="h-4 w-4" />
          Add Employee
        </Button>
      </div>

      <div className="relative w-full sm:max-w-sm">
        <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search employees..."
          className="pl-9"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
          }}
        />
      </div>

      <AddEmployeeDialog open={showAdd} onClose={() => { setShowAdd(false); }} />

      <Card>
        <CardHeader>
          <CardTitle>All Employees</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <ErrorState onRetry={() => void refetch()} />
          ) : data?.employees.length === 0 ? (
            <EmptyState
              illustration={search ? 'search' : 'employees'}
              title={search ? 'No results found' : 'No employees yet'}
              description={search ? `No employees match "${search}".` : 'Add your first employee to get started.'}
              action={search ? undefined : { label: 'Add Employee', onClick: () => { setShowAdd(true); } }}
            />
          ) : (
            <div className="space-y-2">
              {data?.employees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => {
                    void navigate(`/employees/${emp.id}`);
                  }}
                  className="hover:bg-muted flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors"
                >
                  <Avatar>
                    <AvatarImage src={emp.avatarUrl ?? undefined} alt={`${emp.firstName} ${emp.lastName}`} />
                    <AvatarFallback>
                      {emp.firstName[0]}
                      {emp.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {emp.firstName} {emp.lastName}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {emp.employeeCode} · {emp.workEmail}
                    </p>
                  </div>
                  <Badge variant={emp.status === 'ACTIVE' ? 'success' : 'secondary'} className="shrink-0">
                    {emp.status}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
