import { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Pencil, Upload, Trash2, FileText, ExternalLink, IndianRupee, ScrollText } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useEmployee, useUpdateEmployee } from '@/hooks/useEmployees';
import { EditEmployeeDialog } from '@/components/employees/EditEmployeeDialog';
import { useUploadFile } from '@/hooks/useUpload';
import { useDocuments, useCreateDocument, useDeleteDocument, type DocumentType } from '@/hooks/useDocuments';
import { useSalaryRevisions, useCreateSalaryRevision } from '@/hooks/useSalary';
import { fetchExperienceLetter, fetchSalaryCertificate } from '@/hooks/useLetters';
import { printLetter } from '@/lib/printLetter';
import { toast } from 'sonner';

const DOC_TYPE_LABELS: Record<string, string> = {
  OFFER_LETTER: 'Offer Letter',
  APPOINTMENT_LETTER: 'Appointment Letter',
  ID_PROOF: 'ID Proof',
  ADDRESS_PROOF: 'Address Proof',
  EDUCATIONAL: 'Educational Certificate',
  PAYSLIP: 'Payslip',
  FORM_16: 'Form 16',
  EXPERIENCE_LETTER: 'Experience Letter',
  RELIEVING_LETTER: 'Relieving Letter',
  OTHER: 'Other',
};

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
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

function formatBytes(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: employee, isLoading } = useEmployee(id ?? '');
  const [showEdit, setShowEdit] = useState(false);
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [docType, setDocType] = useState<DocumentType>('ID_PROOF');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [showSetSalary, setShowSetSalary] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const { mutate: updateEmployee } = useUpdateEmployee(id ?? '');
  const { mutate: uploadFile, isPending: isUploadingAvatar } = useUploadFile('avatars');
  const { data: documents = [] } = useDocuments(id ?? '');
  const { mutate: createDocument, isPending: isSavingDoc } = useCreateDocument();
  const { mutate: deleteDocument } = useDeleteDocument(id ?? '');
  const { mutate: uploadDocFile, isPending: isUploadingDoc } = useUploadFile('documents');
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

  function handleDocSubmit() {
    if (!docFile || !id) return;
    uploadDocFile(docFile, {
      onSuccess: ({ url }) => {
        createDocument(
          {
            employeeId: id,
            type: docType,
            name: docFile.name,
            url,
            size: docFile.size,
            mimeType: docFile.type || undefined,
          },
          {
            onSuccess: () => {
              setShowDocUpload(false);
              setDocFile(null);
            },
          },
        );
      },
      onError: () => toast.error('Failed to upload document'),
    });
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Documents
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => setShowDocUpload(true)}>
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Upload
              </Button>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  No documents uploaded yet.
                </p>
              ) : (
                <div className="divide-y">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 py-3">
                      <FileText className="text-muted-foreground h-5 w-5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{doc.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {DOC_TYPE_LABELS[doc.type] ?? doc.type}
                          {doc.size ? ` · ${formatBytes(doc.size)}` : ''}
                          {' · '}
                          {new Date(doc.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                        title="Open document"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <button
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => deleteDocument(doc.id)}
                        title="Delete document"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

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

          {/* Upload Document Dialog */}
          <Dialog open={showDocUpload} onOpenChange={setShowDocUpload}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label className="mb-1.5 block">Document Type</Label>
                  <Select
                    value={docType}
                    onValueChange={(v) => setDocType(v as DocumentType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DOC_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1.5 block">File</Label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium"
                    onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                  />
                  {docFile && (
                    <p className="text-muted-foreground mt-1 text-xs">
                      {docFile.name} · {formatBytes(docFile.size)}
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setShowDocUpload(false); setDocFile(null); }}>
                  Cancel
                </Button>
                <Button
                  onClick={handleDocSubmit}
                  disabled={!docFile || isUploadingDoc || isSavingDoc}
                >
                  {isUploadingDoc || isSavingDoc ? 'Uploading...' : 'Upload'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
