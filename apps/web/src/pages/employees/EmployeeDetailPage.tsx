import { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Pencil, IndianRupee, ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useEmployee, useUpdateEmployee } from '@/hooks/useEmployees';
import { useOfficeLocations, useAssignEmployeeLocation } from '@/hooks/useOfficeLocations';
import { useAuthStore } from '@/stores/auth.store';
import { EditEmployeeDialog } from '@/components/employees/EditEmployeeDialog';
import { useUploadFile } from '@/hooks/useUpload';
import { EmployeeDocuments } from '@/components/documents/EmployeeDocuments';
import { useSalaryRevisions, useCreateSalaryRevision } from '@/hooks/useSalary';
import { fetchExperienceLetter, fetchSalaryCertificate } from '@/hooks/useLetters';
import { printLetter } from '@/lib/printLetter';
import { toast } from 'sonner';


function InfoRow({ label, value }: { label: string; value?: string | number | null | undefined }) {
  return (
    <div className="flex justify-between py-1.5 text-sm border-b border-border/50 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%] wrap-break-word">{value ?? '—'}</span>
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

function previewComponents(ctc: number) {
  const monthly = ctc / 12;
  const basic = Math.round((monthly * 0.4) / 100) * 100;
  const hra = Math.round((basic * 0.5) / 100) * 100;
  const lta = Math.round((basic * 0.0833) / 100) * 100;
  const special = Math.max(0, Math.round(monthly - basic - hra - lta));
  const gross = basic + hra + lta + special;
  const pfEmp = basic > 15000 ? 1800 : Math.round(basic * 0.12);
  const esiEmp = gross <= 21000 ? Math.round(gross * 0.0075) : 0;
  const netPay = gross - pfEmp - esiEmp;
  const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  return { basic, hra, lta, special, gross, pfEmp, esiEmp, netPay, monthly, fmt };
}

function SetSalaryDialog({
  employeeId: _employeeId,
  open,
  onClose,
  onSave,
  isPending,
}: {
  employeeId: string;
  open: boolean;
  onClose: () => void;
  onSave: (ctc: number, effectiveFrom: string, reason: string) => void;
  isPending: boolean;
}) {
  const [ctcInput, setCtcInput] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('');

  const ctc = parseFloat(ctcInput.replace(/,/g, '')) || 0;
  const preview = ctc > 0 ? previewComponents(ctc) : null;

  function handleSave() {
    if (ctc <= 0 || !effectiveFrom) return;
    onSave(ctc, effectiveFrom, reason);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setCtcInput(''); setReason(''); onClose(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Salary</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Annual CTC (₹) *</Label>
              <Input
                placeholder="e.g. 600000"
                value={ctcInput}
                onChange={(e) => { setCtcInput(e.target.value); }}
              />
            </div>
            <div className="space-y-1">
              <Label>Effective From *</Label>
              <Input
                type="date"
                value={effectiveFrom}
                onChange={(e) => { setEffectiveFrom(e.target.value); }}
              />
            </div>
          </div>

          {preview && (
            <div className="bg-muted/40 rounded-lg p-3 text-sm">
              <p className="mb-2 font-medium text-xs uppercase tracking-wide text-muted-foreground">
                Auto-calculated breakdown
              </p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Basic Salary (40%)</span>
                  <span>{preview.fmt.format(preview.basic)}</span>
                </div>
                <div className="flex justify-between">
                  <span>HRA (50% of Basic)</span>
                  <span>{preview.fmt.format(preview.hra)}</span>
                </div>
                {preview.lta > 0 && (
                  <div className="flex justify-between">
                    <span>Leave Travel Allowance</span>
                    <span>{preview.fmt.format(preview.lta)}</span>
                  </div>
                )}
                {preview.special > 0 && (
                  <div className="flex justify-between">
                    <span>Special Allowance</span>
                    <span>{preview.fmt.format(preview.special)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-1 font-medium">
                  <span>Gross / month</span>
                  <span>{preview.fmt.format(preview.gross)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>PF (Employee 12%)</span>
                  <span>- {preview.fmt.format(preview.pfEmp)}</span>
                </div>
                {preview.esiEmp > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>ESI (Employee 0.75%)</span>
                    <span>- {preview.fmt.format(preview.esiEmp)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-1 font-semibold text-green-700">
                  <span>Estimated Net Pay / month</span>
                  <span>{preview.fmt.format(preview.netPay)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <Label>Reason / Notes (optional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => { setReason(e.target.value); }}
              placeholder="e.g. Annual increment, promotion, joining offer…"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={ctc <= 0 || !effectiveFrom || isPending}
            onClick={handleSave}
          >
            {isPending ? 'Saving…' : 'Save Salary'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChangeLocationDialog({
  employeeId,
  currentLocationId,
  open,
  onClose,
}: {
  employeeId: string;
  currentLocationId?: string;
  open: boolean;
  onClose: () => void;
}) {
  const { data: locations = [], isLoading } = useOfficeLocations();
  const assignMutation = useAssignEmployeeLocation();
  const [selected, setSelected] = useState<string | null>(currentLocationId ?? null);

  // Sync selection when dialog opens with a different employee
  useEffect(() => {
    if (open) setSelected(currentLocationId ?? null);
  }, [open, currentLocationId]);

  const handleSave = () => {
    assignMutation.mutate(
      { employeeId, locationId: selected },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Change Office Location</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-2 py-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-1 py-1">
            <button
              onClick={() => setSelected(null)}
              className={`w-full rounded-lg px-4 py-2.5 text-left text-sm transition-colors ${
                selected === null
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              <span className="font-medium">No location</span>
              <span className={`ml-2 text-xs ${selected === null ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                Remove assignment
              </span>
            </button>
            {locations.map((loc) => (
              <button
                key={loc.id}
                onClick={() => setSelected(loc.id)}
                className={`w-full rounded-lg px-4 py-2.5 text-left text-sm transition-colors ${
                  selected === loc.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <span className="font-medium">{loc.name}</span>
                {loc.address && (
                  <span className={`ml-2 text-xs ${selected === loc.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {loc.address}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={assignMutation.isPending}>
            {assignMutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: employee, isLoading } = useEmployee(id ?? '');
  const currentUser = useAuthStore((s) => s.user);
  const [showEdit, setShowEdit] = useState(false);
  const [showSetSalary, setShowSetSalary] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const { mutate: updateEmployee } = useUpdateEmployee(id ?? '');
  const { mutate: uploadFile, isPending: isUploadingAvatar } = useUploadFile('avatars');
  const { data: salaryRevisions = [] } = useSalaryRevisions(id ?? '');
  const { mutate: createSalaryRevision, isPending: isSavingSalary } = useCreateSalaryRevision(id ?? '');
  const [letterPending, setLetterPending] = useState<'experience' | 'salary' | null>(null);

  async function handleExperienceLetter() {
    if (!id) return;
    setLetterPending('experience');
    try {
      const data = await fetchExperienceLetter(id);
      const pronoun = data.employee.gender === 'FEMALE' ? 'her' : 'his';
      const fmtDate = (iso: string | null) =>
        iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
      const html = `
        <div class="org-header">
          <div class="org-name">${data.organization.name}</div>
          <div class="org-sub">${data.organization.address} · ${data.organization.email}</div>
        </div>
        <div class="date-line">Date: ${fmtDate(data.issuedDate)}</div>
        <div class="letter-title">EXPERIENCE CERTIFICATE</div>
        <div class="salutation">To Whom It May Concern,</div>
        <p class="body-text">
          This is to certify that <span class="highlight">${data.employee.name}</span>
          (Employee Code: <span class="highlight">${data.employee.code}</span>)
          was employed with <span class="highlight">${data.organization.name}</span>
          from <span class="highlight">${fmtDate(data.employee.dateOfJoining)}</span>
          as <span class="highlight">${data.employee.designation}</span>
          in the <span class="highlight">${data.employee.department}</span> department.
        </p>
        <p class="body-text">
          During ${pronoun} tenure with us, ${pronoun.replace('her', 'she').replace('his', 'he')} has consistently demonstrated professionalism and dedication. We found ${pronoun} to be a sincere and hardworking individual.
        </p>
        <p class="body-text">
          We wish ${pronoun} all the very best in ${pronoun} future endeavours.
        </p>
        <div class="sign-block">
          <p>Yours sincerely,</p>
          <div class="sign-line"></div>
          <p style="margin-top:6px;font-weight:bold;">Authorised Signatory</p>
          <p>${data.organization.name}</p>
        </div>`;
      printLetter(html, 'Experience Certificate');
    } catch {
      toast.error('Failed to generate experience letter');
    } finally {
      setLetterPending(null);
    }
  }

  async function handleSalaryCertificate() {
    if (!id) return;
    setLetterPending('salary');
    try {
      const data = await fetchSalaryCertificate(id);
      const fmtDate = (iso: string | null) =>
        iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
      const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
      const salaryRows = data.salary
        ? `<table class="table-block">
            <tr><td>Annual CTC</td><td>${fmt.format(data.salary.ctc)}</td></tr>
            <tr><td>Monthly Gross</td><td>${fmt.format(data.salary.gross)}</td></tr>
            <tr><td>Monthly Basic</td><td>${fmt.format(data.salary.basic)}</td></tr>
            <tr><td>Monthly Net Pay</td><td>${fmt.format(data.salary.netPay)}</td></tr>
          </table>`
        : '<p class="body-text"><em>Salary details not available.</em></p>';
      const html = `
        <div class="org-header">
          <div class="org-name">${data.organization.name}</div>
          <div class="org-sub">${data.organization.address} · ${data.organization.email}</div>
        </div>
        <div class="date-line">Date: ${fmtDate(data.issuedDate)}</div>
        <div class="letter-title">SALARY CERTIFICATE</div>
        <div class="salutation">To Whom It May Concern,</div>
        <p class="body-text">
          This is to certify that <span class="highlight">${data.employee.name}</span>
          (Employee Code: <span class="highlight">${data.employee.code}</span>)
          is employed with <span class="highlight">${data.organization.name}</span>
          as <span class="highlight">${data.employee.designation}</span>
          in the <span class="highlight">${data.employee.department}</span> department
          since <span class="highlight">${fmtDate(data.employee.dateOfJoining)}</span>.
        </p>
        <p class="body-text">The details of their current compensation are as follows:</p>
        ${salaryRows}
        <p class="body-text">This certificate is issued upon the request of the employee for the purpose as mentioned by them.</p>
        <div class="sign-block">
          <p>Yours sincerely,</p>
          <div class="sign-line"></div>
          <p style="margin-top:6px;font-weight:bold;">HR Department</p>
          <p>${data.organization.name}</p>
        </div>`;
      printLetter(html, 'Salary Certificate');
    } catch {
      toast.error('Failed to generate salary certificate');
    } finally {
      setLetterPending(null);
    }
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadFile(file, {
      onSuccess: ({ url }) => {
        updateEmployee({ avatarUrl: url } as Parameters<typeof updateEmployee>[0], {
          onSuccess: () => toast.success('Profile photo updated'),
        });
      },
      onError: () => toast.error('Failed to upload photo'),
    });
    e.target.value = '';
  }


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
            {/* Avatar with upload overlay */}
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={employee.avatarUrl ?? undefined} alt={`${employee.firstName} ${employee.lastName}`} />
                <AvatarFallback className="text-base">
                  {employee.firstName[0]}{employee.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <button
                className="absolute -bottom-1 -right-1 rounded-full bg-primary p-1 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
                title="Change photo"
              >
                <Camera className="h-3 w-3" />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleAvatarChange}
              />
            </div>

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
              <div className="flex items-center justify-between border-b border-border/50 py-1.5 text-sm last:border-0">
                <span className="text-muted-foreground">Office Location</span>
                <div className="flex items-center gap-2">
                  <span className="max-w-[180px] truncate text-right font-medium">
                    {(employee as { officeLocation?: { name: string } }).officeLocation?.name ?? '—'}
                  </span>
                  {(() => {
                    const viewerRole = currentUser?.role;
                    const targetRole = (employee as { role?: string }).role;
                    const canChange =
                      viewerRole === 'SUPER_ADMIN' ||
                      (viewerRole === 'ORG_ADMIN' &&
                        employee.id !== currentUser?.id &&
                        (targetRole === 'HR' || targetRole === 'EMPLOYEE')) ||
                      (viewerRole === 'HR' &&
                        employee.id !== currentUser?.id &&
                        targetRole === 'EMPLOYEE');
                    return canChange ? (
                      <button
                        onClick={() => setShowLocationDialog(true)}
                        className="text-primary hover:text-primary/80 text-xs underline underline-offset-2"
                      >
                        Change
                      </button>
                    ) : null;
                  })()}
                </div>
              </div>
            </Section>

            <Section title="Current Address">
              <InfoRow label="Address" value={formatAddress(employee.presentAddress)} />
              {employee.presentAddress?.country && (
                <InfoRow label="Country" value={employee.presentAddress.country} />
              )}
            </Section>

            <Section title="Permanent Address">
              <InfoRow label="Address" value={formatAddress(employee.permanentAddress)} />
              {employee.permanentAddress?.country && (
                <InfoRow label="Country" value={employee.permanentAddress.country} />
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

          {/* Documents section */}
          <EmployeeDocuments employeeId={id ?? ''} isHRView />

          {/* Salary section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Salary
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => { setShowSetSalary(true); }}>
                <IndianRupee className="mr-1.5 h-3.5 w-3.5" />
                {salaryRevisions.length > 0 ? 'Revise Salary' : 'Set Salary'}
              </Button>
            </CardHeader>
            <CardContent>
              {salaryRevisions.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  No salary set. Click &ldquo;Set Salary&rdquo; to add one.
                </p>
              ) : (
                <div className="space-y-4">
                  {salaryRevisions.map((rev, i) => {
                    const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
                    return (
                      <div key={rev.id} className={i > 0 ? 'border-t pt-4' : ''}>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Effective {new Date(rev.effectiveFrom).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            {i === 0 && <Badge variant="secondary" className="ml-2 text-xs">Current</Badge>}
                          </span>
                          <span className="text-sm font-semibold">{fmt.format(rev.ctc)} / year</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="bg-muted/40 rounded p-2 text-center">
                            <p className="text-xs text-muted-foreground">Gross/mo</p>
                            <p className="font-medium">{fmt.format(rev.gross)}</p>
                          </div>
                          <div className="bg-muted/40 rounded p-2 text-center">
                            <p className="text-xs text-muted-foreground">Basic/mo</p>
                            <p className="font-medium">{fmt.format(rev.basic)}</p>
                          </div>
                          <div className="bg-muted/40 rounded p-2 text-center">
                            <p className="text-xs text-muted-foreground">Net Pay/mo</p>
                            <p className="font-medium">{fmt.format(rev.netPay)}</p>
                          </div>
                        </div>
                        {rev.reason && (
                          <p className="mt-1.5 text-xs text-muted-foreground italic">{rev.reason}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* HR Letters */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                HR Letters
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={letterPending === 'experience'}
                onClick={() => { void handleExperienceLetter(); }}
              >
                <ScrollText className="mr-1.5 h-3.5 w-3.5" />
                {letterPending === 'experience' ? 'Generating…' : 'Experience Letter'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={letterPending === 'salary'}
                onClick={() => { void handleSalaryCertificate(); }}
              >
                <ScrollText className="mr-1.5 h-3.5 w-3.5" />
                {letterPending === 'salary' ? 'Generating…' : 'Salary Certificate'}
              </Button>
            </CardContent>
          </Card>

          <EditEmployeeDialog
            employee={employee}
            open={showEdit}
            onClose={() => { setShowEdit(false); }}
          />

          <ChangeLocationDialog
            employeeId={id ?? ''}
            {...((employee as { officeLocationId?: string }).officeLocationId !== undefined
              ? { currentLocationId: (employee as { officeLocationId?: string }).officeLocationId }
              : {})}
            open={showLocationDialog}
            onClose={() => setShowLocationDialog(false)}
          />

          {/* Set Salary Dialog */}
          <SetSalaryDialog
            employeeId={id ?? ''}
            open={showSetSalary}
            onClose={() => { setShowSetSalary(false); }}
            onSave={(ctc, effectiveFrom, reason) => {
              createSalaryRevision(
                { employeeId: id ?? '', ctc, effectiveFrom, ...(reason ? { reason } : {}) },
                { onSuccess: () => { setShowSetSalary(false); } },
              );
            }}
            isPending={isSavingSalary}
          />

        </>
      )}
    </div>
  );
}
