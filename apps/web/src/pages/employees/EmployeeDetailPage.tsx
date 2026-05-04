import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useEmployee } from '@/hooks/useEmployees';
import { EditEmployeeDialog } from '@/components/employees/EditEmployeeDialog';

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex justify-between py-1.5 text-sm border-b border-border/50 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%] break-words">{value ?? '—'}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">{children}</CardContent>
    </Card>
  );
}

function formatDate(iso?: string | null) {
  if (!iso) return undefined;
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatAddress(addr?: { line1?: string; line2?: string; city?: string; state?: string; pincode?: string } | null) {
  if (!addr) return undefined;
  return [addr.line1, addr.line2, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ') || undefined;
}

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: employee, isLoading } = useEmployee(id ?? '');
  const [showEdit, setShowEdit] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => { void navigate(-1); }}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {isLoading ? (
          <div className="space-y-1">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-28" />
          </div>
        ) : employee ? (
          <>
            <Avatar className="h-12 w-12">
              <AvatarFallback className="text-base">
                {employee.firstName[0]}{employee.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{employee.firstName} {employee.lastName}</h1>
              <p className="text-muted-foreground text-sm">
                {employee.employeeCode}
                {employee.designation ? ` · ${employee.designation}` : ''}
                {employee.department?.name ? ` · ${employee.department.name}` : ''}
              </p>
            </div>
            <Badge className="ml-2" variant={employee.status === 'ACTIVE' ? 'success' : 'secondary'}>
              {employee.status}
            </Badge>
            <Button className="ml-auto" onClick={() => { setShowEdit(true); }}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </>
        ) : null}
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail sections */}
      {!isLoading && employee && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Section title="Personal Information">
              <InfoRow label="Personal Email" value={employee.email} />
              <InfoRow label="Work Email" value={employee.workEmail} />
              <InfoRow label="Phone" value={employee.phone} />
              <InfoRow label="Date of Birth" value={formatDate(employee.dateOfBirth)} />
              <InfoRow label="Gender" value={employee.gender} />
              <InfoRow label="Blood Group" value={employee.bloodGroup} />
              <InfoRow label="Marital Status" value={employee.maritalStatus} />
            </Section>

            <Section title="Employment">
              <InfoRow label="Employee Code" value={employee.employeeCode} />
              <InfoRow label="Designation" value={employee.designation} />
              <InfoRow label="Department" value={employee.department?.name} />
              <InfoRow label="Reporting Manager" value={employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : undefined} />
              <InfoRow label="Employment Type" value={employee.employmentType} />
              <InfoRow label="Role" value={employee.role} />
              <InfoRow label="Date of Joining" value={formatDate(employee.dateOfJoining)} />
              <InfoRow label="Date of Confirmation" value={formatDate(employee.dateOfConfirmation)} />
            </Section>

            <Section title="Current Address">
              <InfoRow
                label="Address"
                value={formatAddress(employee.presentAddress)}
              />
              {employee.presentAddress?.country && (
                <InfoRow label="Country" value={employee.presentAddress.country} />
              )}
            </Section>

            <Section title="Emergency Contact">
              <InfoRow label="Name" value={employee.emergencyContact?.name} />
              <InfoRow label="Phone" value={employee.emergencyContact?.phone} />
              <InfoRow label="Relationship" value={employee.emergencyContact?.relationship} />
            </Section>

            <Section title="Education">
              <InfoRow label="Degree / Qualification" value={employee.educationDetails?.degree} />
              <InfoRow label="Institution" value={employee.educationDetails?.institution} />
              <InfoRow label="Year of Passing" value={employee.educationDetails?.year} />
            </Section>

            <Section title="Work Experience">
              <InfoRow label="Total Experience" value={employee.experienceDetails?.totalYears != null ? `${employee.experienceDetails.totalYears} years` : undefined} />
              <InfoRow label="Last Company" value={employee.experienceDetails?.lastCompany} />
              <InfoRow label="Last Designation" value={employee.experienceDetails?.lastDesignation} />
            </Section>

            <Section title="Statutory">
              <InfoRow label="PAN" value={employee.panNumber} />
              <InfoRow label="Aadhaar" value={employee.aadhaarNumber ? `••••••••${employee.aadhaarNumber.slice(-4)}` : undefined} />
              <InfoRow label="PF Account" value={employee.pfAccountNumber} />
              <InfoRow label="ESI Number" value={employee.esiNumber} />
              <InfoRow label="UAN" value={employee.uanNumber} />
            </Section>

            <Section title="Bank Details">
              <InfoRow label="Bank Name" value={employee.bankName} />
              <InfoRow label="IFSC Code" value={employee.bankIfsc} />
              <InfoRow label="Account Number" value={employee.bankAccountNumber ? `••••${employee.bankAccountNumber.slice(-4)}` : undefined} />
              <InfoRow label="Branch" value={employee.bankBranch} />
            </Section>
          </div>

          <EditEmployeeDialog
            employee={employee}
            open={showEdit}
            onClose={() => { setShowEdit(false); }}
          />
        </>
      )}
    </div>
  );
}
