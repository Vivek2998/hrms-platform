import { useEffect, useState } from 'react';
import { DateSelectPicker } from '@/components/ui/date-select-picker';
import { useAuthStore } from '@/stores/auth.store';
import { useMyProfile, useUpdateMyProfile, type MyProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const { data: profile, isLoading } = useMyProfile();
  const { mutate: save, isPending } = useUpdateMyProfile();
  const [form, setForm] = useState<FormState>(blankForm());

  useEffect(() => {
    if (profile) setForm(profileToForm(profile));
  }, [profile]);

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSave() {
    save({
      phone: form.phone || undefined,
      dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth).toISOString() : undefined,
      bloodGroup: form.bloodGroup || undefined,
      maritalStatus: (form.maritalStatus as MyProfile['maritalStatus']) || undefined,
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
      bankName: form.bankName || undefined,
      bankIfsc: form.bankIfsc || undefined,
      bankAccountNumber: form.bankAccount || undefined,
      bankBranch: form.bankBranch || undefined,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and personal information</p>
      </div>

      {/* Account overview — read-only */}
      <Card className="max-w-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between py-1 border-b border-border/50">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{user?.firstName} {user?.lastName}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border/50">
            <span className="text-muted-foreground">Work Email</span>
            <span className="font-medium">{user?.workEmail}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border/50">
            <span className="text-muted-foreground">Employee Code</span>
            <span className="font-medium">{user?.employeeCode}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">Role</span>
            <Badge variant="secondary">{user?.role}</Badge>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="max-w-2xl space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : (
        <div className="max-w-2xl space-y-6">

          {/* Personal Details */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Personal Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <F label="Phone">
                <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 98765 43210" />
              </F>
              <F label="Date of Birth">
                <DateSelectPicker value={form.dateOfBirth} onChange={(v) => set('dateOfBirth', v)} />
              </F>
              <F label="Blood Group">
                <Select value={form.bloodGroup} onValueChange={(v) => set('bloodGroup', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </F>
              <F label="Marital Status">
                <Select value={form.maritalStatus} onValueChange={(v) => set('maritalStatus', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {[['SINGLE', 'Single'], ['MARRIED', 'Married'], ['DIVORCED', 'Divorced'], ['WIDOWED', 'Widowed']].map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </F>
            </CardContent>
          </Card>

          {/* Current Address */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Current Address</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(['presentLine1', 'presentLine2', 'presentCity', 'presentState', 'presentPincode'] as const).map((key) => {
                const labels: Record<typeof key, string> = {
                  presentLine1: 'Address Line 1', presentLine2: 'Address Line 2',
                  presentCity: 'City', presentState: 'State', presentPincode: 'Pincode',
                };
                return (
                  <F key={key} label={labels[key]}>
                    <Input value={form[key]} onChange={(e) => set(key, e.target.value)} />
                  </F>
                );
              })}
            </CardContent>
          </Card>

          {/* Permanent Address */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Permanent Address</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(['permanentLine1', 'permanentLine2', 'permanentCity', 'permanentState', 'permanentPincode'] as const).map((key) => {
                const labels: Record<typeof key, string> = {
                  permanentLine1: 'Address Line 1', permanentLine2: 'Address Line 2',
                  permanentCity: 'City', permanentState: 'State', permanentPincode: 'Pincode',
                };
                return (
                  <F key={key} label={labels[key]}>
                    <Input value={form[key]} onChange={(e) => set(key, e.target.value)} />
                  </F>
                );
              })}
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <F label="Contact Name">
                <Input value={form.ecName} onChange={(e) => set('ecName', e.target.value)} placeholder="Full name" />
              </F>
              <F label="Phone">
                <Input value={form.ecPhone} onChange={(e) => set('ecPhone', e.target.value)} placeholder="+91 98765 43210" />
              </F>
              <F label="Relationship">
                <Input value={form.ecRelationship} onChange={(e) => set('ecRelationship', e.target.value)} placeholder="e.g. Spouse, Parent" />
              </F>
            </CardContent>
          </Card>

          {/* Bank Details */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Bank Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <F label="Bank Name">
                <Input value={form.bankName} onChange={(e) => set('bankName', e.target.value)} placeholder="e.g. HDFC Bank" />
              </F>
              <F label="IFSC Code">
                <Input value={form.bankIfsc} onChange={(e) => set('bankIfsc', e.target.value.toUpperCase())} placeholder="HDFC0001234" />
              </F>
              <F label="Account Number">
                <Input value={form.bankAccount} onChange={(e) => set('bankAccount', e.target.value)} placeholder="Account number" />
              </F>
              <F label="Branch">
                <Input value={form.bankBranch} onChange={(e) => set('bankBranch', e.target.value)} placeholder="Branch name" />
              </F>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
