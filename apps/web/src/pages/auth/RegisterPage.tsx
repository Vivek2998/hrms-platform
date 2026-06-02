import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Loader2, ChevronRight, ChevronLeft, Building2, UserCircle, Palette, Check } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { apiClient } from '@/lib/axios';
import { useAuthStore } from '@/stores/auth.store';
import { INDUSTRY_LABELS } from '@/lib/industry-templates';
import type { UserRole, OrgPlan } from '@hrms/shared-types';

// ── Zod schema for required fields (steps 1 + 2) ────────────────────────────

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

// ── Branding step state (all optional) ──────────────────────────────────────

interface BrandingState {
  logoUrl: string;
  employeeCodePrefix: string;
  primaryColor: string;
  sidebarStyle: 'light' | 'dark' | 'branded';
}

// ── Derive prefix from org name (mirrors backend logic) ─────────────────────

function derivePrefix(orgName: string): string {
  const cleaned = orgName.toUpperCase().replace(/[^A-Z\s]/g, '').trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const initials = words.map((w) => w[0]).join('').slice(0, 5);
    return initials.length >= 2 ? initials : (words[0] ?? 'EMP').slice(0, 4);
  }
  return (words[0] ?? 'EMP').slice(0, 4);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function FieldLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
      {optional && <span className="ml-1 normal-case tracking-normal font-normal text-muted-foreground/70">(optional)</span>}
    </p>
  );
}

function FieldError({ msg }: { msg: string | undefined }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-destructive">{msg}</p>;
}

// ── Step indicator ───────────────────────────────────────────────────────────

const STEPS = [
  { n: 1, label: 'Company',  Icon: Building2 },
  { n: 2, label: 'Account',  Icon: UserCircle },
  { n: 3, label: 'Branding', Icon: Palette },
] as const;

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="mb-8 flex items-center justify-between">
      {STEPS.map(({ n, label, Icon }, i) => {
        const done = current > n;
        const active = current === n;
        return (
          <div key={n} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  done
                    ? 'border-primary bg-primary text-primary-foreground'
                    : active
                    ? 'border-primary text-primary bg-background'
                    : 'border-muted text-muted-foreground bg-background'
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              </div>
              <span
                className={`text-[10px] font-medium ${
                  active ? 'text-primary' : done ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mx-2 mt-[-14px] h-px flex-1 transition-colors ${current > n ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Inline colour picker ─────────────────────────────────────────────────────

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isValid = /^#[0-9A-Fa-f]{6}$/.test(value);
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="h-9 w-9 shrink-0 rounded-md border border-input shadow-sm cursor-pointer"
        style={{ backgroundColor: isValid ? value : '#e5e7eb' }}
        title="Click to pick colour"
      />
      <input
        ref={inputRef}
        type="color"
        value={isValid ? value : '#2563eb'}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
      />
      <Input
        value={value}
        onChange={(e) => {
          const v = e.target.value.toUpperCase();
          onChange(v.startsWith('#') ? v : '#' + v);
        }}
        placeholder="#2563EB"
        className="font-mono uppercase text-sm"
        maxLength={7}
      />
    </div>
  );
}

// ── Sidebar style selector ───────────────────────────────────────────────────

const SIDEBAR_OPTIONS = [
  { value: 'light',    label: 'Light',    desc: 'Clean white sidebar' },
  { value: 'dark',     label: 'Dark',     desc: 'Dark slate sidebar' },
  { value: 'branded',  label: 'Branded',  desc: 'Sidebar uses your colour' },
] as const;

function SidebarPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: 'light' | 'dark' | 'branded') => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {SIDEBAR_OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-lg border p-2.5 text-left transition-colors ${
            value === o.value
              ? 'border-primary bg-primary/5 ring-1 ring-primary'
              : 'border-border hover:border-muted-foreground/40'
          }`}
        >
          <p className="text-xs font-semibold">{o.label}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground leading-tight">{o.desc}</p>
        </button>
      ))}
    </div>
  );
}

// ── API response type ────────────────────────────────────────────────────────

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

// ── Main component ───────────────────────────────────────────────────────────

export default function RegisterPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [branding, setBranding] = useState<BrandingState>({
    logoUrl: '',
    employeeCodePrefix: '',
    primaryColor: '#2563EB',
    sidebarStyle: 'light',
  });

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
    // Pre-fill prefix from company name if not yet set
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
        name: data.name,
        slug: data.slug,
        email: data.email,
        adminFirstName: data.adminFirstName,
        adminLastName:  data.adminLastName,
        adminEmail:     data.adminEmail,
        adminPassword:  data.adminPassword,
      };
      if (data.industryType)                   body.industryType       = data.industryType;
      if (b.employeeCodePrefix)                body.employeeCodePrefix = b.employeeCodePrefix.toUpperCase();
      if (b.logoUrl.trim())                    body.logoUrl            = b.logoUrl.trim();
      if (b.primaryColor !== '#2563EB')        body.primaryColor       = b.primaryColor;
      if (b.sidebarStyle !== 'light')          body.sidebarStyle       = b.sidebarStyle;

      const res = await apiClient.post<{ data: RegisterResponse }>('/auth/register', body);
      const { accessToken, refreshToken, employee } = res.data.data;
      setTokens(accessToken, refreshToken);
      setUser({
        id: employee.id,
        organizationId: employee.organizationId,
        orgName: employee.orgName,
        orgLogoUrl: employee.orgLogoUrl,
        orgPlan: employee.orgPlan,
        role: employee.role as UserRole,
        firstName: employee.firstName,
        lastName: employee.lastName,
        workEmail: employee.workEmail,
        employeeCode: employee.employeeCode,
        avatarUrl: employee.avatarUrl,
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
  const e = form.formState.errors;

  return (
    <AuthLayout variant="register">
      {/* Step indicator */}
      <StepIndicator current={step} />

      {/* ── Step 1: Company ── */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Your Company</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Basic details about your organisation.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <FieldLabel>Company Name</FieldLabel>
              <Input
                placeholder="Acme Pvt Ltd"
                className="h-10"
                {...form.register('name', {
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                    const slug = e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9\s-]/g, '')
                      .replace(/\s+/g, '-')
                      .replace(/-+/g, '-')
                      .slice(0, 50);
                    form.setValue('slug', slug, { shouldValidate: false });
                  },
                })}
              />
              <FieldError msg={e.name?.message} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>URL Slug</FieldLabel>
                <Input placeholder="acme-pvt-ltd" className="h-10" {...form.register('slug')} />
                {e.slug ? (
                  <FieldError msg={e.slug.message} />
                ) : (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Login URL: /login?org={slug || 'slug'}
                  </p>
                )}
              </div>
              <div>
                <FieldLabel>Company Email</FieldLabel>
                <Input type="email" placeholder="hr@acme.in" className="h-10" {...form.register('email')} />
                <FieldError msg={e.email?.message} />
              </div>
            </div>

            <div>
              <FieldLabel optional>Industry</FieldLabel>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                {...form.register('industryType')}
              >
                <option value="">Select industry…</option>
                {Object.entries(INDUSTRY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <Button type="button" className="w-full h-10" onClick={goToStep2}>
            Continue
            <ChevronRight className="h-4 w-4" />
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
                <FieldLabel>First Name</FieldLabel>
                <Input className="h-10" {...form.register('adminFirstName')} />
                <FieldError msg={e.adminFirstName?.message} />
              </div>
              <div>
                <FieldLabel>Last Name</FieldLabel>
                <Input className="h-10" {...form.register('adminLastName')} />
                <FieldError msg={e.adminLastName?.message} />
              </div>
            </div>

            <div>
              <FieldLabel>Work Email</FieldLabel>
              <Input type="email" placeholder="you@acme.in" className="h-10" {...form.register('adminEmail')} />
              <FieldError msg={e.adminEmail?.message} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Password</FieldLabel>
                <Input type="password" placeholder="Min 8 characters" className="h-10" {...form.register('adminPassword')} />
                <FieldError msg={e.adminPassword?.message} />
              </div>
              <div>
                <FieldLabel>Confirm</FieldLabel>
                <Input type="password" className="h-10" {...form.register('confirmPassword')} />
                <FieldError msg={e.confirmPassword?.message} />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="h-10 w-full" onClick={() => setStep(1)}>
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <Button type="button" className="h-10 w-full" onClick={goToStep3}>
              Continue
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Branding ── */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Identity & Branding</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Personalise your workspace. Everything here can be changed anytime in Settings.
            </p>
          </div>

          <div className="space-y-5">
            {/* Employee code prefix */}
            <div>
              <FieldLabel optional>Employee Code Prefix</FieldLabel>
              <Input
                value={branding.employeeCodePrefix}
                onChange={(e) =>
                  setBranding((b) => ({
                    ...b,
                    employeeCodePrefix: e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5),
                  }))
                }
                placeholder="e.g. SSIPL, TCS, INFY"
                className="h-10 font-mono uppercase"
                maxLength={5}
              />
              {branding.employeeCodePrefix.length >= 2 ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Employees will be <span className="font-mono font-semibold text-foreground">{branding.employeeCodePrefix}-1</span>, <span className="font-mono font-semibold text-foreground">{branding.employeeCodePrefix}-2</span>, …
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">2–5 uppercase letters (leave blank to auto-derive)</p>
              )}
            </div>

            {/* Logo URL */}
            <div>
              <FieldLabel optional>Company Logo URL</FieldLabel>
              <Input
                type="url"
                value={branding.logoUrl}
                onChange={(e) => setBranding((b) => ({ ...b, logoUrl: e.target.value }))}
                placeholder="https://yoursite.com/logo.png"
                className="h-10 text-sm"
              />
              {branding.logoUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <img
                    src={branding.logoUrl}
                    alt="Logo preview"
                    className="h-8 w-16 rounded border bg-white object-contain"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                  <span className="text-xs text-muted-foreground">Preview</span>
                </div>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                Shown in the sidebar. You can upload a file after setup via Settings.
              </p>
            </div>

            {/* Primary colour */}
            <div>
              <FieldLabel optional>Primary Brand Colour</FieldLabel>
              <ColorPicker
                value={branding.primaryColor}
                onChange={(v) => setBranding((b) => ({ ...b, primaryColor: v }))}
              />
              <p className="mt-1 text-xs text-muted-foreground">Used for buttons, accents, and highlights.</p>
            </div>

            {/* Sidebar style */}
            <div>
              <FieldLabel optional>Sidebar Style</FieldLabel>
              <SidebarPicker
                value={branding.sidebarStyle}
                onChange={(v) => setBranding((b) => ({ ...b, sidebarStyle: v }))}
              />
            </div>
          </div>

          {serverError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2.5 text-sm text-destructive">{serverError}</p>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="h-10 w-full" onClick={() => setStep(2)} disabled={isSubmitting}>
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <Button type="button" className="h-10 flex-1" onClick={() => submit()} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? 'Creating…' : 'Create Account'}
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            className="h-9 w-full text-sm text-muted-foreground hover:text-foreground"
            onClick={() => submit({ logoUrl: '', employeeCodePrefix: '', primaryColor: '#2563EB', sidebarStyle: 'light' })}
            disabled={isSubmitting}
          >
            Skip & use defaults →
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
