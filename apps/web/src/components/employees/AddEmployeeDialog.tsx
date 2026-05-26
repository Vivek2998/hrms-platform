import { useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X } from 'lucide-react';
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
import { useCreateEmployee } from '@/hooks/useEmployees';
import { useDepartments } from '@/hooks/useDepartments';
import { useEmployees } from '@/hooks/useEmployees';

const schema = z.object({
  // Personal
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
  // Employment
  workEmail: z.string().email('Invalid work email'),
  employmentType: z
    .enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'CONSULTANT'])
    .default('FULL_TIME'),
  designation: z.string().optional(),
  departmentId: z.string().optional(),
  managerId: z.string().optional(),
  dateOfJoining: z.string().optional(),
  // Address
  presentLine1: z.string().optional(),
  presentLine2: z.string().optional(),
  presentCity: z.string().optional(),
  presentState: z.string().optional(),
  presentPincode: z.string().optional(),
  // Emergency contact
  emergencyName: z.string().optional(),
  emergencyPhone: z.string().optional(),
  emergencyRelation: z.string().optional(),
  // Education (dynamic list)
  educations: z
    .array(
      z.object({
        degree: z.string().optional(),
        institution: z.string().optional(),
        year: z.string().optional(),
      }),
    )
    .default([{}]),
  // Experience (dynamic list)
  experiences: z
    .array(
      z.object({
        totalYears: z.string().optional(),
        lastCompany: z.string().optional(),
        lastDesignation: z.string().optional(),
      }),
    )
    .default([{}]),
  // Account
  password: z
    .string()
    .min(8, 'Minimum 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      'Must include uppercase, lowercase, number and special character',
    ),
});

type FormValues = z.infer<typeof schema>;

interface AddEmployeeDialogProps {
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
  error?: string | undefined;
  required?: boolean | undefined;
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

const TABS = [
  { value: 'personal', label: 'Personal' },
  { value: 'employment', label: 'Employment' },
  { value: 'address', label: 'Address' },
  { value: 'education', label: 'Education' },
  { value: 'account', label: 'Account' },
] as const;

export function AddEmployeeDialog({ open, onClose }: AddEmployeeDialogProps) {
  const [activeTab, setActiveTab] = useState<string>('personal');
  const { mutate: createEmployee, isPending } = useCreateEmployee();
  const { data: departments = [] } = useDepartments();
  const { data: employeeList } = useEmployees({ limit: 100 });
  const managers = employeeList?.employees ?? [];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      employmentType: 'FULL_TIME',
      educations: [{}],
      experiences: [{}],
    },
  });

  const errors = form.formState.errors;

  const {
    fields: eduFields,
    append: appendEducation,
    remove: removeEducation,
  } = useFieldArray({ control: form.control, name: 'educations' });
  const {
    fields: expFields,
    append: appendExperience,
    remove: removeExperience,
  } = useFieldArray({ control: form.control, name: 'experiences' });

  // Backend schema expects YYYY-MM-DD (date-only). Never send full ISO datetime
  // strings (toISOString() → "2000-01-15T00:00:00.000Z") — those fail the
  // /^\d{4}-\d{2}-\d{2}$/ regex and produce a 400 Bad Request.
  const toDateStr = (date?: string) => (date?.trim() ? date.slice(0, 10) : undefined);

  const onSubmit = (values: FormValues) => {
    const payload = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      workEmail: values.workEmail,
      password: values.password,
      phone: values.phone || undefined,
      dateOfBirth: toDateStr(values.dateOfBirth),
      gender: values.gender,
      bloodGroup: values.bloodGroup || undefined,
      maritalStatus: values.maritalStatus,
      employmentType: values.employmentType,
      designation: values.designation || undefined,
      departmentId: values.departmentId || undefined,
      managerId: values.managerId || undefined,
      dateOfJoining: toDateStr(values.dateOfJoining),
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
      emergencyContact:
        values.emergencyName || values.emergencyPhone
          ? {
              name: values.emergencyName,
              phone: values.emergencyPhone,
              relationship: values.emergencyRelation,
            }
          : undefined,
      educationDetails: values.educations
        ?.filter((e) => e.degree || e.institution)
        .map((e) => ({
          degree: e.degree || undefined,
          institution: e.institution || undefined,
          year: e.year ? parseInt(e.year) : undefined,
        })),
      experienceDetails: values.experiences
        ?.filter((e) => e.lastCompany || e.totalYears)
        .map((e) => ({
          totalYears: e.totalYears ? parseFloat(e.totalYears) : undefined,
          lastCompany: e.lastCompany || undefined,
          lastDesignation: e.lastDesignation || undefined,
        })),
    };

    createEmployee(payload, {
      onSuccess: () => {
        form.reset();
        onClose();
      },
    });
  };

  const handleClose = () => {
    form.reset();
    setActiveTab('personal');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent aria-describedby={undefined} className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div>
              {/* Mobile: select dropdown */}
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="mb-4 sm:hidden">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TABS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Desktop: tab bar */}
              <TabsList className="mb-4 hidden w-full sm:grid sm:grid-cols-5">
                {TABS.map((t) => (
                  <TabsTrigger key={t.value} value={t.value}>
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <div className="h-[300px] overflow-y-auto pr-1">
              {/* ── Tab 1: Personal ── */}
              <TabsContent value="personal" className="space-y-4">
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                              <SelectItem key={bg} value={bg}>
                                {bg}
                              </SelectItem>
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
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

              {/* ── Tab 2: Employment ── */}
              <TabsContent value="employment" className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Work Email" required error={errors.workEmail?.message}>
                    <Input type="email" {...form.register('workEmail')} />
                  </Field>
                  <Field label="Designation">
                    <Input placeholder="e.g. Software Engineer" {...form.register('designation')} />
                  </Field>
                  <Field label="Employment Type">
                    <Controller
                      control={form.control}
                      name="employmentType"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
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
                        <DateSelectPicker
                          value={field.value}
                          onChange={field.onChange}
                          maxYear={new Date().getFullYear() + 2}
                        />
                      )}
                    />
                  </Field>
                  <Field label="Department">
                    <Controller
                      control={form.control}
                      name="departmentId"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((d) => (
                              <SelectItem key={d.id} value={d.id}>
                                {d.name}
                              </SelectItem>
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select manager" />
                          </SelectTrigger>
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
                </div>
              </TabsContent>

              {/* ── Tab 3: Address & Emergency ── */}
              <TabsContent value="address" className="space-y-6">
                <div>
                  <p className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wide">
                    Current Address
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Address Line 1">
                      <Input {...form.register('presentLine1')} />
                    </Field>
                    <Field label="Address Line 2">
                      <Input {...form.register('presentLine2')} />
                    </Field>
                    <Field label="City">
                      <Input {...form.register('presentCity')} />
                    </Field>
                    <Field label="State">
                      <Input {...form.register('presentState')} />
                    </Field>
                    <Field label="Pincode">
                      <Input {...form.register('presentPincode')} />
                    </Field>
                  </div>
                </div>

                <div>
                  <p className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wide">
                    Emergency Contact
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Contact Name">
                      <Input {...form.register('emergencyName')} />
                    </Field>
                    <Field label="Contact Phone">
                      <Input placeholder="+91 98765 43210" {...form.register('emergencyPhone')} />
                    </Field>
                    <Field label="Relationship">
                      <Input
                        placeholder="e.g. Spouse, Parent"
                        {...form.register('emergencyRelation')}
                      />
                    </Field>
                  </div>
                </div>
              </TabsContent>

              {/* ── Tab 4: Education & Experience ── */}
              <TabsContent value="education" className="space-y-5">
                {/* Education */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                      Education
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        appendEducation({ degree: '', institution: '', year: '' });
                      }}
                    >
                      <Plus className="mr-1 h-3 w-3" /> Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {eduFields.map((field, index) => (
                      <div key={field.id} className="relative rounded-md border p-3">
                        {eduFields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              removeEducation(index);
                            }}
                            className="text-muted-foreground hover:text-destructive absolute right-2 top-2"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <Field label="Degree / Qualification">
                            <Input
                              placeholder="e.g. B.Tech, MBA"
                              {...form.register(`educations.${index}.degree`)}
                            />
                          </Field>
                          <Field label="Institution">
                            <Input
                              placeholder="College / University"
                              {...form.register(`educations.${index}.institution`)}
                            />
                          </Field>
                          <Field label="Year of Passing">
                            <Input
                              type="number"
                              placeholder="e.g. 2020"
                              {...form.register(`educations.${index}.year`)}
                            />
                          </Field>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Experience */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                      Work Experience
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        appendExperience({ totalYears: '', lastCompany: '', lastDesignation: '' });
                      }}
                    >
                      <Plus className="mr-1 h-3 w-3" /> Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {expFields.map((field, index) => (
                      <div key={field.id} className="relative rounded-md border p-3">
                        {expFields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              removeExperience(index);
                            }}
                            className="text-muted-foreground hover:text-destructive absolute right-2 top-2"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <Field label="Total Experience (Years)">
                            <Input
                              type="number"
                              step="0.5"
                              placeholder="e.g. 3.5"
                              {...form.register(`experiences.${index}.totalYears`)}
                            />
                          </Field>
                          <Field label="Last Company">
                            <Input {...form.register(`experiences.${index}.lastCompany`)} />
                          </Field>
                          <Field label="Last Designation">
                            <Input {...form.register(`experiences.${index}.lastDesignation`)} />
                          </Field>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* ── Tab 5: Account ── */}
              <TabsContent value="account" className="space-y-2">
                <Field label="Initial Password" required error={errors.password?.message}>
                  <Input type="password" {...form.register('password')} />
                </Field>
                <p className="text-muted-foreground text-[10px] leading-relaxed">
                  Must be at least 8 characters with uppercase, lowercase, number, and special
                  character (@$!%*?&). The employee will be prompted to change this on first login.
                </p>
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="mt-4 border-t pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Employee'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
