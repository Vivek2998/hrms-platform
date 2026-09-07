import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { apiClient } from '@/lib/axios';
import { useAuthStore } from '@/stores/auth.store';
import { INDUSTRY_LABELS } from '@/lib/industry-templates';
import type { UserRole, OrgPlan } from '@hrms/shared-types';
import { FieldLabel } from '@/components/auth/FieldLabel';
import { FieldError } from './register/FieldError';
import { PasswordStrengthMeter } from './register/PasswordStrengthMeter';
import { StepIndicator } from './register/StepIndicator';
import { ColorPicker } from './register/ColorPicker';
import { SidebarPicker } from './register/SidebarPicker';
import { ImagePicker } from './register/ImagePicker';

// ── Zod schema ────────────────────────────────────────────────────────────────

const schema = z
  .object({
    name: z.string().min(2, 'Company name must be at least 2 characters'),
    slug: z
      .string()
      .min(2, 'Slug must be at least 2 characters')
      .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, and hyphens only'),
    email: z.string().email('Enter a valid email'),
    industryType: z.string().optional(),
    adminFirstName: z.string().min(1, 'Required'),
    adminLastName: z.string().min(1, 'Required'),
    adminEmail: z.string().email('Enter a valid email'),
    adminPassword: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, 'Must include uppercase, lowercase, number and symbol'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.adminPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

// ── Branding state ────────────────────────────────────────────────────────────

interface BrandingState {
  logoFile: File | null;
  logoUrl: string;
  bgImageFile: File | null;
  bgImageUrl: string;
  employeeCodePrefix: string;
  primaryColor: string;
  sidebarStyle: 'light' | 'dark' | 'branded';
}

const DEFAULT_BRANDING: BrandingState = {
  logoFile: null,
  logoUrl: '',
  bgImageFile: null,
  bgImageUrl: '',
  employeeCodePrefix: '',
  primaryColor: '#2563EB',
  sidebarStyle: 'light',
};

// ── Derive prefix from org name (mirrors backend logic) ──────────────────────

function derivePrefix(orgName: string): string {
  const cleaned = orgName.toUpperCase().replace(/[^A-Z\s]/g, '').trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const initials = words.map((w) => w[0]).join('').slice(0, 5);
    return initials.length >= 2 ? initials : (words[0] ?? 'EMP').slice(0, 4);
  }
  return (words[0] ?? 'EMP').slice(0, 4);
}

// ── API response type ─────────────────────────────────────────────────────────

interface RegisterResponse {
  accessToken: string;
  refreshToken: string;
  employee: {
    id: string;
    organizationId: string;
    orgName: string;
    orgLogoUrl: string | null;
    orgPlan: OrgPlan;
    role: string;
    firstName: string;
    lastName: string;
    workEmail: string;
    employeeCode: string;
    avatarUrl: string | null;
    mustChangePassword: boolean;
  };
}

// ── Main component ────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branding, setBranding] = useState<BrandingState>(DEFAULT_BRANDING);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', slug: '', email: '', industryType: '',
      adminFirstName: '', adminLastName: '', adminEmail: '',
      adminPassword: '', confirmPassword: '',
    },
    mode: 'onTouched',
  });

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  // ── Step navigation ────────────────────────────────────────────────────────

  async function goToStep2() {
    const ok = await form.trigger(['name', 'slug', 'email']);
    if (!ok) return;
    setBranding((b) => ({
      ...b,
      employeeCodePrefix: b.employeeCodePrefix || derivePrefix(form.getValues('name')),
    }));
    setStep(2);
  }

  async function goToStep3() {
    const ok = await form.trigger(['adminFirstName', 'adminLastName', 'adminEmail', 'adminPassword', 'confirmPassword']);
    if (!ok) return;
    setStep(3);
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function submit(brandingOverride?: BrandingState) {
    const valid = await form.trigger();
    if (!valid) { setStep(1); return; }

    const b = brandingOverride ?? branding;
    setServerError('');
    setIsSubmitting(true);
    try {
      const data = form.getValues();
      const body: Record<string, unknown> = {
        name:           data.name,
        slug:           data.slug,
        email:          data.email,
        adminFirstName: data.adminFirstName,
        adminLastName:  data.adminLastName,
        adminEmail:     data.adminEmail,
        adminPassword:  data.adminPassword,
      };
      if (data.industryType)              body.industryType       = data.industryType;
      if (b.employeeCodePrefix)           body.employeeCodePrefix = b.employeeCodePrefix.toUpperCase();
      if (b.logoUrl.trim() && !b.logoFile)   body.logoUrl         = b.logoUrl.trim();
      if (b.bgImageUrl.trim() && !b.bgImageFile) body.bgImageUrl  = b.bgImageUrl.trim();
      if (b.primaryColor !== '#2563EB')   body.primaryColor       = b.primaryColor;
      if (b.sidebarStyle !== 'light')     body.sidebarStyle       = b.sidebarStyle;

      const res = await apiClient.post<{ data: RegisterResponse }>('/auth/register', body);
      const { accessToken, refreshToken, employee } = res.data.data;

      // Set tokens so subsequent authenticated requests use them
      setTokens(accessToken, refreshToken);

      // Upload logo file if selected, then persist URL to org
      let finalLogoUrl: string | null = employee.orgLogoUrl;
      if (b.logoFile) {
        try {
          const fd = new FormData();
          fd.append('file', b.logoFile);
          const up = await apiClient.post<{ data: { url: string } }>(
            '/upload?folder=logos', fd,
            { headers: { 'Content-Type': 'multipart/form-data' } },
          );
          finalLogoUrl = up.data.data.url;
          await apiClient.patch('/organizations/settings/general', { logoUrl: finalLogoUrl });
        } catch { /* non-critical */ }
      }

      // Upload background image file if selected, then persist URL to theme config
      if (b.bgImageFile) {
        try {
          const fd = new FormData();
          fd.append('file', b.bgImageFile);
          const up = await apiClient.post<{ data: { url: string } }>(
            '/upload?folder=backgrounds', fd,
            { headers: { 'Content-Type': 'multipart/form-data' } },
          );
          await apiClient.patch('/org/theme/background', { bgImageUrl: up.data.data.url });
        } catch { /* non-critical */ }
      }

      setUser({
        id:              employee.id,
        organizationId:  employee.organizationId,
        orgName:         employee.orgName,
        orgLogoUrl:      finalLogoUrl,
        orgPlan:         employee.orgPlan,
        role:            employee.role as UserRole,
        firstName:       employee.firstName,
        lastName:        employee.lastName,
        workEmail:       employee.workEmail,
        employeeCode:    employee.employeeCode,
        avatarUrl:       employee.avatarUrl,
        mustChangePassword: employee.mustChangePassword,
      });
      navigate('/dashboard');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setServerError(e.response?.data?.error ?? 'Registration failed. Please try again.');
      setStep(1);
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const slug = form.watch('slug');
  const adminPassword = form.watch('adminPassword');
  const e = form.formState.errors;

  return (
    <AuthLayout variant="register">
      <StepIndicator current={step} />

      {/* ── Step 1: Company ── */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Your Company</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Basic details about your organisation.</p>
          </div>

          <div className="space-y-4">
            <div>
              <FieldLabel htmlFor="register-name">Company Name</FieldLabel>
              <Input
                id="register-name"
                placeholder="Acme Pvt Ltd"
                className="h-10"
                {...form.register('name', {
                  onChange: (ev: React.ChangeEvent<HTMLInputElement>) => {
                    const s = ev.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9\s-]/g, '')
                      .replace(/\s+/g, '-')
                      .replace(/-+/g, '-')
                      .slice(0, 50);
                    form.setValue('slug', s, { shouldValidate: false });
                  },
                })}
              />
              <FieldError msg={e.name?.message} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel htmlFor="register-slug">URL Slug</FieldLabel>
                <Input id="register-slug" placeholder="acme-pvt-ltd" className="h-10" {...form.register('slug')} />
                {e.slug ? (
                  <FieldError msg={e.slug.message} />
                ) : (
                  <p className="mt-1 text-[11px] text-muted-foreground">Login URL: /login?org={slug || 'slug'}</p>
                )}
              </div>
              <div>
                <FieldLabel htmlFor="register-email">Company Email</FieldLabel>
                <Input id="register-email" type="email" placeholder="hr@acme.in" className="h-10" {...form.register('email')} />
                <FieldError msg={e.email?.message} />
              </div>
            </div>

            {/* C-10: Radix Select replaces native <select> — consistent cross-browser styling */}
            <div>
              <FieldLabel htmlFor="register-industry" optional>Industry</FieldLabel>
              <Select
                value={form.watch('industryType') ?? ''}
                onValueChange={(v) => form.setValue('industryType', v, { shouldValidate: true })}
              >
                <SelectTrigger id="register-industry" className="h-10">
                  <SelectValue placeholder="Select industry…" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INDUSTRY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="button" className="h-10 w-full gap-1.5" onClick={goToStep2}>
            Continue
            <ChevronRight className="h-4 w-4 shrink-0" />
          </Button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-xs text-muted-foreground">Already have an account?</span>
            </div>
          </div>
          <Link to="/login">
            <Button variant="outline" type="button" className="h-10 w-full">Sign in instead</Button>
          </Link>
        </div>
      )}

      {/* ── Step 2: Admin Account ── */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Your Admin Account</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              You'll be the organisation admin. You can add more users after setup.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel htmlFor="register-admin-first">First Name</FieldLabel>
                <Input id="register-admin-first" className="h-10" {...form.register('adminFirstName')} />
                <FieldError msg={e.adminFirstName?.message} />
              </div>
              <div>
                <FieldLabel htmlFor="register-admin-last">Last Name</FieldLabel>
                <Input id="register-admin-last" className="h-10" {...form.register('adminLastName')} />
                <FieldError msg={e.adminLastName?.message} />
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="register-admin-email">Work Email</FieldLabel>
              <Input id="register-admin-email" type="email" placeholder="you@acme.in" className="h-10" {...form.register('adminEmail')} />
              <FieldError msg={e.adminEmail?.message} />
            </div>

            {/* I-11: Password with strength meter */}
            <div>
              <FieldLabel htmlFor="register-admin-password">Password</FieldLabel>
              <Input
                id="register-admin-password"
                type="password"
                placeholder="Min 8 characters"
                className="h-10"
                {...form.register('adminPassword')}
              />
              <PasswordStrengthMeter password={adminPassword} />
              <FieldError msg={e.adminPassword?.message} />
            </div>

            <div>
              <FieldLabel htmlFor="register-confirm-password">Confirm Password</FieldLabel>
              <Input id="register-confirm-password" type="password" className="h-10" {...form.register('confirmPassword')} />
              <FieldError msg={e.confirmPassword?.message} />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="h-10 shrink-0 gap-1" onClick={() => setStep(1)}>
              <ChevronLeft className="h-4 w-4 shrink-0" />
              Back
            </Button>
            <Button type="button" className="h-10 flex-1 gap-1.5" onClick={goToStep3}>
              Continue
              <ChevronRight className="h-4 w-4 shrink-0" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Branding ── */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="mb-4">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Identity & Branding</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Personalise your workspace. All of this can be changed anytime in Settings.
            </p>
          </div>

          {/* Employee code prefix */}
          <div>
            <FieldLabel htmlFor="register-emp-prefix" optional>Employee Code Prefix</FieldLabel>
            <Input
              id="register-emp-prefix"
              value={branding.employeeCodePrefix}
              onChange={(ev) =>
                setBranding((b) => ({
                  ...b,
                  employeeCodePrefix: ev.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5),
                }))
              }
              placeholder="e.g. SSIPL, TCS, INFY"
              className="h-10 font-mono uppercase"
              maxLength={5}
            />
            {branding.employeeCodePrefix.length >= 2 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Employees will be{' '}
                <span className="font-mono font-semibold text-foreground">{branding.employeeCodePrefix}-1</span>,{' '}
                <span className="font-mono font-semibold text-foreground">{branding.employeeCodePrefix}-2</span>, …
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">2–5 uppercase letters (leave blank to auto-derive)</p>
            )}
          </div>

          {/* Company logo */}
          <div>
            <FieldLabel optional>Company Logo</FieldLabel>
            <ImagePicker
              file={branding.logoFile}
              url={branding.logoUrl}
              onFileChange={(f) => setBranding((b) => ({ ...b, logoFile: f }))}
              onUrlChange={(u) => setBranding((b) => ({ ...b, logoUrl: u }))}
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              maxLabel="PNG, JPG, SVG, WEBP · max 5 MB"
              urlPlaceholder="https://yoursite.com/logo.png"
              uploadNote="Uploaded after your account is created."
              previewShape="contain"
            />
          </div>

          {/* Primary colour */}
          <div>
            <FieldLabel htmlFor="register-primary-color" optional>Primary Brand Colour</FieldLabel>
            <ColorPicker
              value={branding.primaryColor}
              onChange={(v) => setBranding((b) => ({ ...b, primaryColor: v }))}
            />
            <p className="mt-1 text-xs text-muted-foreground">Used for buttons, links, and active states.</p>
          </div>

          {/* Sidebar style */}
          <div>
            <FieldLabel optional>Sidebar Style</FieldLabel>
            <SidebarPicker
              value={branding.sidebarStyle}
              onChange={(v) => setBranding((b) => ({ ...b, sidebarStyle: v }))}
            />
          </div>

          {/* App background image */}
          <div>
            <FieldLabel optional>App Background</FieldLabel>
            <ImagePicker
              file={branding.bgImageFile}
              url={branding.bgImageUrl}
              onFileChange={(f) => setBranding((b) => ({ ...b, bgImageFile: f }))}
              onUrlChange={(u) => setBranding((b) => ({ ...b, bgImageUrl: u }))}
              accept="image/png,image/jpeg,image/webp"
              maxLabel="PNG, JPG, WEBP · max 8 MB"
              urlPlaceholder="https://yoursite.com/background.jpg"
              uploadNote="Uploaded after your account is created."
              previewShape="cover"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">Displayed behind the main content area.</p>
          </div>

          {serverError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2.5 text-sm text-destructive">{serverError}</p>
          )}

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="h-10 shrink-0 gap-1" onClick={() => setStep(2)} disabled={isSubmitting}>
              <ChevronLeft className="h-4 w-4 shrink-0" />
              Back
            </Button>
            <Button type="button" className="h-10 flex-1" onClick={() => submit()} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span>{isSubmitting ? 'Creating account…' : 'Create Account'}</span>
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            className="h-9 w-full text-sm text-muted-foreground hover:text-foreground"
            onClick={() => submit(DEFAULT_BRANDING)}
            disabled={isSubmitting}
          >
            Skip & use defaults
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            By creating an account, you agree to our{' '}
            <a href="#" className="hover:text-foreground hover:underline">Terms of Service</a>{' '}
            and{' '}
            <a href="#" className="hover:text-foreground hover:underline">Privacy Policy</a>.
          </p>
        </div>
      )}
    </AuthLayout>
  );
}
