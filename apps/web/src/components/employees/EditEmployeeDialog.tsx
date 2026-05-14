import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateSelectPicker } from '@/components/ui/date-select-picker';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { useUpdateEmployee } from '@/hooks/useEmployees';
import { useDepartments } from '@/hooks/useDepartments';
import { useEmployees } from '@/hooks/useEmployees';
import { useAuthStore } from '@/stores/auth.store';
import type { Employee } from '@hrms/shared-types';

const schema = z.object({
  firstName: z.string().min(1, 'Required').max(50),
  lastName: z.string().min(1, 'Required').max(50),
  email: z.string().email('Invalid email'),
  phone: z
    .string()
    .optional()
    .refine((v) => !v || isValidPhoneNumber(v), {
      message: 'Invalid phone number — use international format, e.g. +91 98765 43210',
    }),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  bloodGroup: z.string().optional(),
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']).optional(),
  workEmail: z.string().email('Invalid work email'),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'CONSULTANT']),
  designation: z.string().optional(),
  departmentId: z.string().optional(),
  managerId: z.string().optional(),
  dateOfJoining: z.string().optional(),
  noticePeriodDays: z.string().optional(),
  presentLine1: z.string().optional(),
  presentLine2: z.string().optional(),
  presentCity: z.string().optional(),
  presentState: z.string().optional(),
  presentPincode: z.string().optional(),
  permLine1: z.string().optional(),
  permLine2: z.string().optional(),
  permCity: z.string().optional(),
  permState: z.string().optional(),
  permPincode: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyPhone: z.string().optional(),
  emergencyRelation: z.string().optional(),
  eduDegree: z.string().optional(),
  eduInstitution: z.string().optional(),
  eduYear: z.string().optional(),
  expTotalYears: z.string().optional(),
  expLastCompany: z.string().optional(),
  expLastDesignation: z.string().optional(),
  // Statutory
  panNumber: z.string().optional(),
  aadhaarNumber: z.string().optional(),
  pfAccountNumber: z.string().optional(),
  esiNumber: z.string().optional(),
  uanNumber: z.string().optional(),
  // Bank
  bankName: z.string().optional(),
  bankIfsc: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankBranch: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface EditEmployeeDialogProps {
  employee: Employee;
  open: boolean;
  onClose: () => void;
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="mb-1.5 block">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-destructive mt-1 text-xs">{error}</p>}
    </div>
  );
}

function toDateInput(iso?: string | null) {
  if (!iso) return '';
  return new Date(iso).toISOString().split('T')[0];
}

function buildDefaults(employee: Employee): FormValues {
  return {
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    phone: employee.phone ?? '',
    dateOfBirth: toDateInput(employee.dateOfBirth),
    gender: employee.gender as FormValues['gender'],
    bloodGroup: employee.bloodGroup ?? '',
    maritalStatus: employee.maritalStatus as FormValues['maritalStatus'],
    workEmail: employee.workEmail ?? '',
    employmentType: (employee.employmentType ?? 'FULL_TIME') as FormValues['employmentType'],
    designation: employee.designation ?? '',
    departmentId: employee.departmentId ?? '',
    managerId: employee.managerId ?? '',
    dateOfJoining: toDateInput(employee.dateOfJoining),
    noticePeriodDays: employee.noticePeriodDays != null ? String(employee.noticePeriodDays) : '',
    presentLine1: employee.presentAddress?.line1 ?? '',
    presentLine2: employee.presentAddress?.line2 ?? '',
    presentCity: employee.presentAddress?.city ?? '',
    presentState: employee.presentAddress?.state ?? '',
    presentPincode: employee.presentAddress?.pincode ?? '',
    permLine1: employee.permanentAddress?.line1 ?? '',
    permLine2: employee.permanentAddress?.line2 ?? '',
    permCity: employee.permanentAddress?.city ?? '',
    permState: employee.permanentAddress?.state ?? '',
    permPincode: employee.permanentAddress?.pincode ?? '',
    emergencyName: employee.emergencyContact?.name ?? '',
    emergencyPhone: employee.emergencyContact?.phone ?? '',
    emergencyRelation: employee.emergencyContact?.relationship ?? '',
    eduDegree: employee.educationDetails?.degree ?? '',
    eduInstitution: employee.educationDetails?.institution ?? '',
    eduYear: employee.educationDetails?.year ? String(employee.educationDetails.year) : '',
    expTotalYears: employee.experienceDetails?.totalYears != null ? String(employee.experienceDetails.totalYears) : '',
    expLastCompany: employee.experienceDetails?.lastCompany ?? '',
    expLastDesignation: employee.experienceDetails?.lastDesignation ?? '',
    panNumber: employee.panNumber ?? '',
    aadhaarNumber: employee.aadhaarNumber ?? '',
    pfAccountNumber: employee.pfAccountNumber ?? '',
    esiNumber: employee.esiNumber ?? '',
    uanNumber: employee.uanNumber ?? '',
    bankName: employee.bankName ?? '',
    bankIfsc: employee.bankIfsc ?? '',
    bankAccountNumber: employee.bankAccountNumber ?? '',
    bankBranch: employee.bankBranch ?? '',
  };
}

const TABS = [
  { value: 'personal', label: 'Personal' },
  { value: 'employment', label: 'Employment' },
  { value: 'address', label: 'Address' },
  { value: 'education', label: 'Education' },
  { value: 'statutory', label: 'Statutory & Bank' },
] as const;

export function EditEmployeeDialog({ employee, open, onClose }: EditEmployeeDialogProps) {
  const [activeTab, setActiveTab] = useState<string>('personal');
  const { mutate: updateEmployee, isPending } = useUpdateEmployee(employee.id);
  const { data: departments = [] } = useDepartments();
  const { data: employeeList } = useEmployees({ limit: 100 });
  const managers = (employeeList?.employees ?? []).filter((e) => e.id !== employee.id);
  const currentUserRole = useAuthStore((s) => s.user?.role);
  const canEditWorkEmail = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(currentUserRole ?? '');

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaults(employee),
  });

  useEffect(() => {
    if (open) form.reset(buildDefaults(employee));
  }, [open, employee, form]);

  const errors = form.formState.errors;
  const toIso = (date?: string) => (date ? new Date(date).toISOString() : undefined);

  const onSubmit = (values: FormValues) => {
    const payload = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      workEmail: values.workEmail,
      phone: values.phone || undefined,
      dateOfBirth: toIso(values.dateOfBirth),
      gender: values.gender,
      bloodGroup: values.bloodGroup || undefined,
      maritalStatus: values.maritalStatus,
      employmentType: values.employmentType,
      designation: values.designation || undefined,
      departmentId: values.departmentId || undefined,
      managerId: values.managerId || undefined,
      dateOfJoining: toIso(values.dateOfJoining),
      noticePeriodDays: values.noticePeriodDays ? parseInt(values.noticePeriodDays) : undefined,
      presentAddress:
        values.presentLine1 || values.presentCity
          ? {
              line1: values.presentLine1,
              line2: values.presentLine2,
              city: values.presentCity,
              state: values.presentState,
              pincode: values.presentPincode,
              country: 'IN',
            }
          : undefined,
      permanentAddress:
        values.permLine1 || values.permCity
          ? {
              line1: values.permLine1,
              line2: values.permLine2,
              city: values.permCity,
              state: values.permState,
              pincode: values.permPincode,
              country: 'IN',
            }
          : undefined,
      emergencyContact:
        values.emergencyName || values.emergencyPhone
          ? {
              name: values.emergencyName,
              phone: values.emergencyPhone,
              relationship: values.emergencyRelation,
            }
          : undefined,
      educationDetails:
        values.eduDegree || values.eduInstitution
          ? {
              degree: values.eduDegree,
              institution: values.eduInstitution,
              year: values.eduYear ? parseInt(values.eduYear) : undefined,
            }
          : undefined,
      experienceDetails:
        values.expTotalYears || values.expLastCompany
          ? {
              totalYears: values.expTotalYears ? parseFloat(values.expTotalYears) : undefined,
              lastCompany: values.expLastCompany,
              lastDesignation: values.expLastDesignation,
            }
          : undefined,
      panNumber: values.panNumber || undefined,
      aadhaarNumber: values.aadhaarNumber || undefined,
      pfAccountNumber: values.pfAccountNumber || undefined,
      esiNumber: values.esiNumber || undefined,
      uanNumber: values.uanNumber || undefined,
      bankName: values.bankName || undefined,
      bankIfsc: values.bankIfsc || undefined,
      bankAccountNumber: values.bankAccountNumber || undefined,
      bankBranch: values.bankBranch || undefined,
    };

    updateEmployee(payload, { onSuccess: onClose });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent aria-describedby={undefined} className="max-w-2xl gap-0 p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Edit Employee</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b px-6 py-3">
              {/* Mobile: select dropdown */}
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="sm:hidden">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TABS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Desktop: tab bar */}
              <TabsList className="hidden w-full sm:flex">
                {TABS.map((t) => (
                  <TabsTrigger key={t.value} value={t.value} className="flex-1">{t.label}</TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Fixed-height content area — always same size regardless of active tab */}
            <div className="h-[55vh] overflow-y-auto px-6 py-5">
              <TabsContent value="personal" className="mt-0 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="First Name" required error={errors.firstName?.message}>
                    <Input {...form.register('firstName')} />
                  </Field>
                  <Field label="Last Name" required error={errors.lastName?.message}>
                    <Input {...form.register('lastName')} />
                  </Field>
                  <Field label="Personal Email" required error={errors.email?.message}>
                    <Input type="email" {...form.register('email')} />
                  </Field>
                  <Field label="Phone" error={errors.phone?.message}>
                    <Input placeholder="+91 98765 43210" {...form.register('phone')} />
                  </Field>
                  <Field label="Date of Birth">
                    <Controller
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <DateSelectPicker value={field.value} onChange={field.onChange} />
                      )}
                    />
                  </Field>
                  <Field label="Gender">
                    <Controller
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value ?? ''}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MALE">Male</SelectItem>
                            <SelectItem value="FEMALE">Female</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                            <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>
                  <Field label="Blood Group">
                    <Controller
                      control={form.control}
                      name="bloodGroup"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value ?? ''}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                              <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>
                  <Field label="Marital Status">
                    <Controller
                      control={form.control}
                      name="maritalStatus"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value ?? ''}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SINGLE">Single</SelectItem>
                            <SelectItem value="MARRIED">Married</SelectItem>
                            <SelectItem value="DIVORCED">Divorced</SelectItem>
                            <SelectItem value="WIDOWED">Widowed</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>
                </div>
              </TabsContent>

              <TabsContent value="employment" className="mt-0 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {canEditWorkEmail && (
                    <Field label="Work Email" required error={errors.workEmail?.message}>
                      <Input type="email" {...form.register('workEmail')} />
                    </Field>
                  )}
                  <Field label="Designation">
                    <Input placeholder="e.g. Software Engineer" {...form.register('designation')} />
                  </Field>
                  <Field label="Employment Type">
                    <Controller
                      control={form.control}
                      name="employmentType"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FULL_TIME">Full Time</SelectItem>
                            <SelectItem value="PART_TIME">Part Time</SelectItem>
                            <SelectItem value="CONTRACT">Contract</SelectItem>
                            <SelectItem value="INTERN">Intern</SelectItem>
                            <SelectItem value="CONSULTANT">Consultant</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>
                  <Field label="Date of Joining">
                    <Controller
                      control={form.control}
                      name="dateOfJoining"
                      render={({ field }) => (
                        <DateSelectPicker value={field.value} onChange={field.onChange} maxYear={new Date().getFullYear() + 2} />
                      )}
                    />
                  </Field>
                  <Field label="Department">
                    <Controller
                      control={form.control}
                      name="departmentId"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value ?? ''}>
                          <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                          <SelectContent>
                            {departments.map((d) => (
                              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>
                  <Field label="Reporting Manager">
                    <Controller
                      control={form.control}
                      name="managerId"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value ?? ''}>
                          <SelectTrigger><SelectValue placeholder="Select manager" /></SelectTrigger>
                          <SelectContent>
                            {managers.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.firstName} {m.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>
                  <Field label="Notice Period (Days)">
                    <Input
                      type="number"
                      min="0"
                      placeholder="e.g. 30"
                      {...form.register('noticePeriodDays')}
                    />
                  </Field>
                </div>
              </TabsContent>

              <TabsContent value="address" className="mt-0 space-y-6">
                <div>
                  <p className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wide">
                    Current Address
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Address Line 1"><Input {...form.register('presentLine1')} /></Field>
                    <Field label="Address Line 2"><Input {...form.register('presentLine2')} /></Field>
                    <Field label="City"><Input {...form.register('presentCity')} /></Field>
                    <Field label="State"><Input {...form.register('presentState')} /></Field>
                    <Field label="Pincode"><Input {...form.register('presentPincode')} /></Field>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wide">
                    Permanent Address
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Address Line 1"><Input {...form.register('permLine1')} /></Field>
                    <Field label="Address Line 2"><Input {...form.register('permLine2')} /></Field>
                    <Field label="City"><Input {...form.register('permCity')} /></Field>
                    <Field label="State"><Input {...form.register('permState')} /></Field>
                    <Field label="Pincode"><Input {...form.register('permPincode')} /></Field>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wide">
                    Emergency Contact
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Contact Name"><Input {...form.register('emergencyName')} /></Field>
                    <Field label="Contact Phone">
                      <Input placeholder="+91 98765 43210" {...form.register('emergencyPhone')} />
                    </Field>
                    <Field label="Relationship">
                      <Input placeholder="e.g. Spouse, Parent" {...form.register('emergencyRelation')} />
                    </Field>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="education" className="mt-0 space-y-6">
                <div>
                  <p className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wide">
                    Highest Education Qualification
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Degree / Qualification">
                      <Input placeholder="e.g. B.Tech, MBA" {...form.register('eduDegree')} />
                    </Field>
                    <Field label="Institution">
                      <Input placeholder="College / University name" {...form.register('eduInstitution')} />
                    </Field>
                    <Field label="Year of Passing">
                      <Input type="number" placeholder="e.g. 2020" {...form.register('eduYear')} />
                    </Field>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wide">
                    Work Experience
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Total Experience (Years)">
                      <Input type="number" step="0.5" placeholder="e.g. 3.5" {...form.register('expTotalYears')} />
                    </Field>
                    <Field label="Last Company"><Input {...form.register('expLastCompany')} /></Field>
                    <Field label="Last Designation"><Input {...form.register('expLastDesignation')} /></Field>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="statutory" className="mt-0 space-y-6">
                <div>
                  <p className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wide">
                    Statutory Details
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="PAN Number">
                      <Input
                        placeholder="e.g. ABCDE1234F"
                        className="uppercase"
                        {...form.register('panNumber', {
                          onChange: (e) => { e.target.value = e.target.value.toUpperCase(); },
                        })}
                      />
                    </Field>
                    <Field label="Aadhaar Number">
                      <Input placeholder="12-digit Aadhaar number" {...form.register('aadhaarNumber')} />
                    </Field>
                    <Field label="PF Account Number">
                      <Input placeholder="e.g. MH/BAN/1234567/000/1234567" {...form.register('pfAccountNumber')} />
                    </Field>
                    <Field label="ESI Number">
                      <Input placeholder="ESI registration number" {...form.register('esiNumber')} />
                    </Field>
                    <Field label="UAN Number">
                      <Input placeholder="Universal Account Number" {...form.register('uanNumber')} />
                    </Field>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wide">
                    Bank Details
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Bank Name">
                      <Input placeholder="e.g. State Bank of India" {...form.register('bankName')} />
                    </Field>
                    <Field label="IFSC Code">
                      <Input
                        placeholder="e.g. SBIN0001234"
                        className="uppercase"
                        {...form.register('bankIfsc', {
                          onChange: (e) => { e.target.value = e.target.value.toUpperCase(); },
                        })}
                      />
                    </Field>
                    <Field label="Account Number">
                      <Input placeholder="Bank account number" {...form.register('bankAccountNumber')} />
                    </Field>
                    <Field label="Branch">
                      <Input placeholder="Branch name" {...form.register('bankBranch')} />
                    </Field>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
