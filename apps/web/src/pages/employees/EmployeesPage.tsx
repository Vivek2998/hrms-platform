import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
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

const PAGE_SIZE = 20;

export default function EmployeesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortAsc, setSortAsc] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  // I-2: reset to page 1 when search changes
  function handleSearch(v: string) {
    setSearch(v);
    setPage(1);
  }

  const { data, isLoading, isError, refetch } = useEmployees({ search, limit: PAGE_SIZE, page });

  // I-3: client-side sort on Name within the current page (server returns unsorted slices)
  const employees = [...(data?.employees ?? [])].sort((a, b) => {
    const na = `${a.firstName} ${a.lastName}`.toLowerCase();
    const nb = `${b.firstName} ${b.lastName}`.toLowerCase();
    return sortAsc ? na.localeCompare(nb) : nb.localeCompare(na);
  });

  const total = data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Search */}
      <div className="relative w-full sm:max-w-sm">
        <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search employees..."
          className="pl-9"
          value={search}
          onChange={(e) => { handleSearch(e.target.value); }}
        />
      </div>

      <AddEmployeeDialog open={showAdd} onClose={() => { setShowAdd(false); }} />

      <Card>
        <CardHeader>
          <CardTitle>All Employees</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
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
            <div className="p-6">
              <ErrorState onRetry={() => void refetch()} />
            </div>
          ) : data?.employees.length === 0 ? (
            <div className="p-6">
              <EmptyState
                illustration={search ? 'search' : 'employees'}
                title={search ? 'No results found' : 'No employees yet'}
                description={
                  search
                    ? `No employees match "${search}".`
                    : 'Add your first employee to get started.'
                }
                action={
                  search ? undefined : { label: 'Add Employee', onClick: () => { setShowAdd(true); } }
                }
              />
            </div>
          ) : (
            // I-3: proper <table> with <thead>, scope="col", and clickable rows
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground border-b text-left text-xs font-medium">
                    <th scope="col" className="px-4 py-3">
                      <button
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                        onClick={() => { setSortAsc((v) => !v); }}
                        aria-label={sortAsc ? 'Sort name descending' : 'Sort name ascending'}
                      >
                        Name
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th scope="col" className="hidden sm:table-cell px-4 py-3">Code</th>
                    <th scope="col" className="hidden md:table-cell px-4 py-3">Email</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {employees.map((emp) => (
                    <tr
                      key={emp.id}
                      className="hover:bg-muted/30 cursor-pointer"
                      onClick={() => { void navigate(`/employees/${emp.id}`); }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage
                              src={emp.avatarUrl ?? undefined}
                              alt={`${emp.firstName} ${emp.lastName}`}
                            />
                            <AvatarFallback className="text-xs">
                              {emp.firstName[0]}{emp.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{emp.firstName} {emp.lastName}</span>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3 text-muted-foreground tabular-nums">
                        {emp.employeeCode}
                      </td>
                      <td className="hidden md:table-cell px-4 py-3 text-muted-foreground">
                        {emp.workEmail}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={emp.status === 'ACTIVE' ? 'success' : 'secondary'}
                          className="shrink-0"
                        >
                          {emp.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* I-2: Pagination controls */}
          {!isLoading && !isError && totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages} · {total} employees
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1"
                  disabled={page <= 1}
                  onClick={() => { setPage((p) => p - 1); }}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1"
                  disabled={page >= totalPages}
                  onClick={() => { setPage((p) => p + 1); }}
                  aria-label="Next page"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
