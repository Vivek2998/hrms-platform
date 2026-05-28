import { useEffect, useRef, useState } from 'react';
import { useSessionStorageState } from '@/hooks/useSessionStorageState';
import { cn } from '@/lib/utils';
import { Building2, Camera, CreditCard, FileText, Home, Loader2, MapPin, Pencil, Phone, User, X } from 'lucide-react';
import { EmployeeDocuments } from '@/components/documents/EmployeeDocuments';
import { DateSelectPicker } from '@/components/ui/date-select-picker';
import { useAuthStore } from '@/stores/auth.store';
import { useMyProfile, useUpdateMyProfile, type MyProfile } from '@/hooks/useProfile';
import { useUploadFile } from '@/hooks/useUpload';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmployeeCodeCard } from '@/components/settings/EmployeeCodeCard';

interface FormState {
  phone: string;
  dateOfBirth: string;
  bloodGroup: string;
  maritalStatus: string;
  presentLine1: string; presentLine2: string; presentCity: string; presentState: string; presentPincode: string;
  permanentLine1: string; permanentLine2: string; permanentCity: string; permanentState: string; permanentPincode: string;
  ecName: string; ecPhone: string; ecRelationship: string;
  bankName: string; bankIfsc: string; bankAccount: string; bankBranch: string;
}

const maritalLabels: Record<string, string> = {
  SINGLE: 'Single', MARRIED: 'Married', DIVORCED: 'Divorced', WIDOWED: 'Widowed',
};

function blankForm(): FormState {
  return {
    phone: '', dateOfBirth: '', bloodGroup: '', maritalStatus: '',
    presentLine1: '', presentLine2: '', presentCity: '', presentState: '', presentPincode: '',
    permanentLine1: '', permanentLine2: '', permanentCity: '', permanentState: '', permanentPincode: '',
    ecName: '', ecPhone: '', ecRelationship: '',
    bankName: '', bankIfsc: '', bankAccount: '', bankBranch: '',
  };
}

function profileToForm(p: MyProfile): FormState {
  const pa = p.presentAddress ?? {};
  const pe = p.permanentAddress ?? {};
  const ec = p.emergencyContact ?? {};
  return {
    phone: p.phone ?? '',
    dateOfBirth: p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : '',
    bloodGroup: p.bloodGroup ?? '',
    maritalStatus: p.maritalStatus ?? '',
    presentLine1: pa.line1 ?? '', presentLine2: pa.line2 ?? '',
    presentCity: pa.city ?? '', presentState: pa.state ?? '', presentPincode: pa.pincode ?? '',
    permanentLine1: pe.line1 ?? '', permanentLine2: pe.line2 ?? '',
    permanentCity: pe.city ?? '', permanentState: pe.state ?? '', permanentPincode: pe.pincode ?? '',
    ecName: ec.name ?? '', ecPhone: ec.phone ?? '', ecRelationship: ec.relationship ?? '',
    bankName: p.bankName ?? '', bankIfsc: p.bankIfsc ?? '',
    bankAccount: p.bankAccountNumber ?? '', bankBranch: p.bankBranch ?? '',
  };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Read-only value display used when not in edit mode
function ReadValue({ value, placeholder = 'Not provided' }: { value?: string; placeholder?: string }) {
  return (
    <p className="flex h-9 items-center text-sm font-medium text-foreground">
      {value?.trim() ? value : <span className="italic text-muted-foreground">{placeholder}</span>}
    </p>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  description,
  className,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn('overflow-hidden shadow-sm', className)}>
      <CardHeader className="border-b bg-muted/40 px-6 pb-4 pt-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground">
            <Icon className="h-4 w-4 text-background" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
        </div>
      </CardHeader>
      {children}
    </Card>
  );
}

type SettingsTab = 'profile' | 'organisation' | 'documents';

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const { data: profile, isLoading } = useMyProfile();
  const { mutate: save, isPending } = useUpdateMyProfile();
  const { mutate: uploadFile, isPending: isUploadingAvatar } = useUploadFile('avatars');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormState>(blankForm());
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useSessionStorageState<SettingsTab>('settings_tab', 'profile');

  const initials = user
    ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()
    : '?';

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadFile(file, {
      onSuccess: ({ url }) => {
        save({ avatarUrl: url } as Parameters<typeof save>[0], {
          onSuccess: () => {
            if (user) setUser({ ...user, avatarUrl: url });
          },
        });
      },
    });
    e.target.value = '';
  }

  useEffect(() => {
    if (profile) setForm(profileToForm(profile));
  }, [profile]);

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleCancel() {
    if (profile) setForm(profileToForm(profile));
    setIsEditing(false);
  }

  function handleSave() {
    save(
      {
        ...(form.phone ? { phone: form.phone } : {}),
        ...(form.dateOfBirth ? { dateOfBirth: form.dateOfBirth.slice(0, 10) } : {}),
        ...(form.bloodGroup ? { bloodGroup: form.bloodGroup } : {}),
        ...(form.maritalStatus ? { maritalStatus: form.maritalStatus as MyProfile['maritalStatus'] } : {}),
        presentAddress: {
          line1: form.presentLine1, line2: form.presentLine2, city: form.presentCity,
          state: form.presentState, pincode: form.presentPincode, country: 'IN',
        },
        permanentAddress: {
          line1: form.permanentLine1, line2: form.permanentLine2, city: form.permanentCity,
          state: form.permanentState, pincode: form.permanentPincode, country: 'IN',
        },
        emergencyContact: {
          name: form.ecName, phone: form.ecPhone, relationship: form.ecRelationship,
        },
        ...(form.bankName ? { bankName: form.bankName } : {}),
        ...(form.bankIfsc ? { bankIfsc: form.bankIfsc } : {}),
        ...(form.bankAccount ? { bankAccountNumber: form.bankAccount } : {}),
        ...(form.bankBranch ? { bankBranch: form.bankBranch } : {}),
      },
      { onSuccess: () => setIsEditing(false) },
    );
  }

  const heroStats: { label: string; value: string }[] = [
    user?.employeeCode ? { label: 'Employee ID', value: user.employeeCode } : null,
    profile?.department?.name ? { label: 'Department', value: profile.department.name } : null,
    user?.role ? { label: 'Role', value: user.role.replace(/_/g, ' ').toLowerCase() } : null,
    profile?.dateOfJoining ? { label: 'Joined', value: fmtDate(profile.dateOfJoining) } : null,
    profile?.officeLocation?.name ? { label: 'Office Location', value: profile.officeLocation.name } : null,
  ].filter((s): s is { label: string; value: string } => s != null);

  const isAdmin = user?.role === 'ORG_ADMIN';

  return (
    <div className="max-w-5xl space-y-6">

      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage your profile and organisation settings</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b">
        {([
          { key: 'profile', label: 'My Profile', icon: User },
          { key: 'documents', label: 'My Documents', icon: FileText },
          ...(isAdmin ? [{ key: 'organisation', label: 'Organisation', icon: Building2 }] : []),
        ] as { key: SettingsTab; label: string; icon: React.ElementType }[]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.key
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Organisation tab */}
      {activeTab === 'organisation' && (
        <div className="space-y-4">
          <EmployeeCodeCard />
        </div>
      )}

      {/* Documents tab */}
      {activeTab === 'documents' && (
        <div className="max-w-3xl">
          <EmployeeDocuments employeeId={user?.id ?? ''} isHRView={false} />
        </div>
      )}

      {/* Profile tab */}
      {activeTab === 'profile' && (
        <>

      {/* ── Profile hero ── */}
      <div className="relative overflow-hidden rounded-xl bg-linear-to-br from-slate-800 via-slate-800 to-slate-900 shadow-lg">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative z-10 p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">

            {/* Avatar + name block */}
            <div className="flex min-w-0 flex-1 items-center gap-5">
              <div className="group relative shrink-0">
                <Avatar className="h-20 w-20 ring-4 ring-white/15 shadow-xl">
                  <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.firstName} />
                  <AvatarFallback className="bg-slate-700 text-2xl font-bold text-white">{initials}</AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/55 opacity-0 transition-opacity group-hover:opacity-100 disabled:cursor-not-allowed"
                  aria-label="Change profile photo"
                >
                  {isUploadingAvatar
                    ? <Loader2 className="h-5 w-5 animate-spin text-white" />
                    : <Camera className="h-5 w-5 text-white" />}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="truncate text-xl font-bold leading-tight text-white">
                  {user?.firstName} {user?.lastName}
                </h2>
                {profile?.designation && (
                  <p className="mt-1 text-sm text-slate-300">{profile.designation}</p>
                )}
                <p className="mt-0.5 truncate text-xs text-slate-400">{user?.workEmail}</p>
              </div>
            </div>

            {heroStats.length > 0 && (
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl border border-white/10 bg-white/5 p-4 lg:w-72 lg:shrink-0">
                {heroStats.map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className="mt-0.5 text-sm font-semibold capitalize text-white">{value.toLowerCase()}</p>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Edit Profile / Save Changes + info banner + Cancel — same row */}
      {/* Always-rendered row — opacity swaps, never layout shifts */}
      <div className="flex items-center justify-between gap-4">
        <div className={cn(
          'flex h-9 flex-1 items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 transition-opacity duration-150',
          !isEditing && 'pointer-events-none opacity-0',
        )}>
          <Pencil className="h-3.5 w-3.5 shrink-0 text-blue-600" />
          <span>You are editing your profile. Click <strong>Save Changes</strong> when done.</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={isPending}
            className={cn('h-9 gap-1.5 transition-opacity duration-150', !isEditing && 'pointer-events-none opacity-0')}
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </Button>
          {!isEditing ? (
            <Button
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-9 w-[130px] justify-center gap-2 bg-foreground text-background hover:bg-foreground/90 shadow-sm"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit Profile
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isPending}
              className="h-9 w-[130px] justify-center bg-foreground text-background hover:bg-foreground/90 shadow-sm"
            >
              {isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
              ) : 'Save Changes'}
            </Button>
          )}
        </div>
      </div>

      {/* ── Form sections ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

            {/* Left column */}
            <div className="flex flex-col gap-4">
              <SectionCard icon={User} title="Personal Details" description="Basic personal information">
                <CardContent className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
                  <F label="Phone Number">
                    {isEditing
                      ? <Input className="h-9" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 98765 43210" />
                      : <ReadValue value={form.phone} />}
                  </F>
                  <F label="Date of Birth">
                    {isEditing
                      ? <DateSelectPicker value={form.dateOfBirth} onChange={(v) => set('dateOfBirth', v)} />
                      : <ReadValue value={form.dateOfBirth ? fmtDate(form.dateOfBirth) : ''} />}
                  </F>
                  <F label="Blood Group">
                    {isEditing
                      ? (
                        <Select value={form.bloodGroup} onValueChange={(v) => set('bloodGroup', v)}>
                          <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => (
                              <SelectItem key={g} value={g}>{g}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )
                      : <ReadValue value={form.bloodGroup} />}
                  </F>
                  <F label="Marital Status">
                    {isEditing
                      ? (
                        <Select value={form.maritalStatus} onValueChange={(v) => set('maritalStatus', v)}>
                          <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'] as const).map((v) => (
                              <SelectItem key={v} value={v}>{maritalLabels[v]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )
                      : <ReadValue value={maritalLabels[form.maritalStatus] ?? form.maritalStatus} />}
                  </F>
                </CardContent>
              </SectionCard>

              <SectionCard icon={Phone} title="Emergency Contact" description="Someone we can reach in case of emergency">
                <CardContent className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
                  <F label="Contact Name">
                    {isEditing
                      ? <Input className="h-9" value={form.ecName} onChange={(e) => set('ecName', e.target.value)} placeholder="Full name" />
                      : <ReadValue value={form.ecName} />}
                  </F>
                  <F label="Phone Number">
                    {isEditing
                      ? <Input className="h-9" value={form.ecPhone} onChange={(e) => set('ecPhone', e.target.value)} placeholder="+91 98765 43210" />
                      : <ReadValue value={form.ecPhone} />}
                  </F>
                  <F label="Relationship">
                    {isEditing
                      ? <Input className="h-9" value={form.ecRelationship} onChange={(e) => set('ecRelationship', e.target.value)} placeholder="e.g. Spouse, Parent" />
                      : <ReadValue value={form.ecRelationship} />}
                  </F>
                </CardContent>
              </SectionCard>

              <SectionCard icon={CreditCard} title="Bank Details" description="For salary and reimbursement credits" className="flex-1">
                <CardContent className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
                  <F label="Bank Name">
                    {isEditing
                      ? <Input className="h-9" value={form.bankName} onChange={(e) => set('bankName', e.target.value)} placeholder="e.g. HDFC Bank" />
                      : <ReadValue value={form.bankName} />}
                  </F>
                  <F label="IFSC Code">
                    {isEditing
                      ? <Input className="h-9" value={form.bankIfsc} onChange={(e) => set('bankIfsc', e.target.value.toUpperCase())} placeholder="HDFC0001234" />
                      : <ReadValue value={form.bankIfsc} />}
                  </F>
                  <F label="Account Number">
                    {isEditing
                      ? <Input className="h-9" value={form.bankAccount} onChange={(e) => set('bankAccount', e.target.value)} placeholder="Account number" />
                      : <ReadValue value={form.bankAccount} />}
                  </F>
                  <F label="Branch Name">
                    {isEditing
                      ? <Input className="h-9" value={form.bankBranch} onChange={(e) => set('bankBranch', e.target.value)} placeholder="Branch name" />
                      : <ReadValue value={form.bankBranch} />}
                  </F>
                </CardContent>
              </SectionCard>
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-4">
              <SectionCard icon={MapPin} title="Current Address" description="Where you currently reside">
                <CardContent className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
                  {(['presentLine1', 'presentLine2', 'presentCity', 'presentState', 'presentPincode'] as const).map((key) => {
                    const labels: Record<typeof key, string> = {
                      presentLine1: 'Address Line 1', presentLine2: 'Address Line 2',
                      presentCity: 'City', presentState: 'State', presentPincode: 'Pincode',
                    };
                    return (
                      <F key={key} label={labels[key]}>
                        {isEditing
                          ? <Input className="h-9" value={form[key]} onChange={(e) => set(key, e.target.value)} />
                          : <ReadValue value={form[key]} />}
                      </F>
                    );
                  })}
                </CardContent>
              </SectionCard>

              <SectionCard icon={Home} title="Permanent Address" description="Your permanent / home address" className="flex-1">
                <CardContent className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
                  {(['permanentLine1', 'permanentLine2', 'permanentCity', 'permanentState', 'permanentPincode'] as const).map((key) => {
                    const labels: Record<typeof key, string> = {
                      permanentLine1: 'Address Line 1', permanentLine2: 'Address Line 2',
                      permanentCity: 'City', permanentState: 'State', permanentPincode: 'Pincode',
                    };
                    return (
                      <F key={key} label={labels[key]}>
                        {isEditing
                          ? <Input className="h-9" value={form[key]} onChange={(e) => set(key, e.target.value)} />
                          : <ReadValue value={form[key]} />}
                      </F>
                    );
                  })}
                </CardContent>
              </SectionCard>
            </div>
          </div>

        </>
      )}

      {/* end profile tab */}
      </>)}

    </div>
  );
}
