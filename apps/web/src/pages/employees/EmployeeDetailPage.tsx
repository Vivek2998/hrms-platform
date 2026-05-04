import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useEmployee } from '@/hooks/useEmployees';
import { formatCurrency, maskAadhaar } from '@hrms/shared-utils';

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: employee, isLoading } = useEmployee(id ?? '');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            void navigate(-1);
          }}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          {isLoading ? (
            <Skeleton className="h-7 w-48" />
          ) : (
            <h1 className="text-2xl font-bold">
              {employee?.firstName} {employee?.lastName}
            </h1>
          )}
          <p className="text-muted-foreground">{employee?.employeeCode}</p>
        </div>
        {employee && (
          <Badge
            className="ml-auto"
            variant={employee.status === 'ACTIVE' ? 'success' : 'secondary'}
          >
            {employee.status}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : employee ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span>{employee.workEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">PAN</span>
                <span className="font-mono">{employee.panNumber ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Aadhaar</span>
                <span className="font-mono">
                  {employee.aadhaarNumber ? maskAadhaar(employee.aadhaarNumber) : '—'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Employment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span>{employee.employmentType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role</span>
                <span>{employee.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date of Joining</span>
                <span>
                  {employee.dateOfJoining
                    ? new Date(employee.dateOfJoining).toLocaleDateString('en-IN')
                    : '—'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bank Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bank</span>
                <span>{employee.bankName ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IFSC</span>
                <span className="font-mono">{employee.bankIfsc ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account</span>
                <span className="font-mono">
                  {employee.bankAccountNumber ? '••••' + employee.bankAccountNumber.slice(-4) : '—'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Statutory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">PF Account</span>
                <span className="font-mono">{employee.pfAccountNumber ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ESI</span>
                <span className="font-mono">{employee.esiNumber ?? '—'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

// suppress unused import warning — formatCurrency used in payslip tab (Phase 4)
void formatCurrency;
