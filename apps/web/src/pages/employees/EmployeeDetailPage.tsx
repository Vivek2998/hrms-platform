import { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Pencil, Upload, Trash2, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Label } from '@/components/ui/label';
import { useEmployee, useUpdateEmployee } from '@/hooks/useEmployees';
import { EditEmployeeDialog } from '@/components/employees/EditEmployeeDialog';
import { useUploadFile } from '@/hooks/useUpload';
import { useDocuments, useCreateDocument, useDeleteDocument, type DocumentType } from '@/hooks/useDocuments';
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

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: employee, isLoading } = useEmployee(id ?? '');
  const [showEdit, setShowEdit] = useState(false);
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [docType, setDocType] = useState<DocumentType>('ID_PROOF');
  const [docFile, setDocFile] = useState<File | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const { mutate: updateEmployee } = useUpdateEmployee(id ?? '');
  const { mutate: uploadFile, isPending: isUploadingAvatar } = useUploadFile('avatars');
  const { data: documents = [] } = useDocuments(id ?? '');
  const { mutate: createDocument, isPending: isSavingDoc } = useCreateDocument();
  const { mutate: deleteDocument } = useDeleteDocument(id ?? '');
  const { mutate: uploadDocFile, isPending: isUploadingDoc } = useUploadFile('documents');

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

          <EditEmployeeDialog
            employee={employee}
            open={showEdit}
            onClose={() => { setShowEdit(false); }}
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
