import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  Loader2, ChevronRight, ChevronLeft, Building2, UserCircle, Palette,
  Check, Upload, X, Link as LinkIcon,
} from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { apiClient } from '@/lib/axios';
import { useAuthStore } from '@/stores/auth.store';
import { INDUSTRY_LABELS } from '@/lib/industry-templates';
import type { UserRole, OrgPlan } from '@hrms/shared-types';

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

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Step indicator ────────────────────────────────────────────────────────────

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
              <span className={`text-[10px] font-medium ${active ? 'text-primary' : done ? 'text-foreground' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mx-2 -mt-3.5 h-px flex-1 transition-colors ${current > n ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Colour picker ─────────────────────────────────────────────────────────────

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isValid = /^#[0-9A-Fa-f]{6}$/.test(value);
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="h-9 w-9 shrink-0 rounded-md border border-input shadow-sm cursor-pointer hover:scale-105 transition-transform"
        style={{ backgroundColor: isValid ? value : '#e5e7eb' }}
        title="Click to pick colour"
      />
      <input ref={inputRef} type="color" value={isValid ? value : '#2563eb'} onChange={(e) => onChange(e.target.value)} className="sr-only" />
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

// ── Sidebar style selector ────────────────────────────────────────────────────

const SIDEBAR_OPTIONS = [
  { value: 'light',   label: 'Light',   desc: 'Clean white sidebar' },
  { value: 'dark',    label: 'Dark',    desc: 'Dark slate sidebar' },
  { value: 'branded', label: 'Branded', desc: 'Uses your brand colour' },
] as const;

function SidebarPicker({ value, onChange }: { value: string; onChange: (v: 'light' | 'dark' | 'branded') => void }) {
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

// ── Shared image picker (used for both logo and background) ───────────────────

type ImageMode = 'file' | 'url';

function ImagePicker({
  file,
  url,
  onFileChange,
  onUrlChange,
  accept,
  maxLabel,
  urlPlaceholder,
  uploadNote,
  previewShape = 'contain',
}: {
  file: File | null;
  url: string;
  onFileChange: (f: File | null) => void;
  onUrlChange: (u: string) => void;
  accept: string;
  maxLabel: string;
  urlPlaceholder: string;
  uploadNote: string;
  previewShape?: 'contain' | 'cover';
}) {
  const [mode, setMode] = useState<ImageMode>('file');
  const fileRef = useRef<HTMLInputElement>(null);
  // Track the current object URL so we can revoke it when the file changes or
  // the component unmounts — avoids a Blob memory leak per file selection.
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!file) {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      return;
    }
    const next = URL.createObjectURL(file);
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = next;
    return () => {
      URL.revokeObjectURL(next);
      objectUrlRef.current = null;
    };
  }, [file]);

  return (
    <div className="space-y-2.5">
      {/* Mode toggle */}
      <div className="flex rounded-md border border-input overflow-hidden text-xs">
        <button
          type="button"
          onClick={() => setMode('file')}
          className={`flex flex-1 items-center justify-center gap-1.5 py-1.5 transition-colors ${
            mode === 'file' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'
          }`}
        >
          <Upload className="h-3 w-3" />
          Upload file
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`flex flex-1 items-center justify-center gap-1.5 py-1.5 transition-colors ${
            mode === 'url' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'
          }`}
        >
          <LinkIcon className="h-3 w-3" />
          Paste URL
        </button>
      </div>

      {mode === 'file' ? (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept={accept}
            className="sr-only"
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
              <img
                src={objectUrlRef.current ?? undefined}
                alt="Preview"
                className={`h-10 w-16 rounded-md border bg-white ${previewShape === 'cover' ? 'object-cover' : 'object-contain'}`}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground">{file.name}</p>
                <p className="text-[10px] text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
              <button
                type="button"
                onClick={() => { onFileChange(null); if (fileRef.current) fileRef.current.value = ''; }}
                className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 py-5 transition-colors hover:bg-muted/40 hover:border-primary/50"
            >
              <Upload className="h-6 w-6 text-muted-foreground" />
              <div className="text-center">
                <p className="text-xs font-medium text-foreground">Click to upload</p>
                <p className="text-[10px] text-muted-foreground">{maxLabel}</p>
              </div>
            </button>
          )}
          <p className="mt-1.5 text-[10px] text-muted-foreground">{uploadNote}</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2">
            <Input
              type="url"
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder={urlPlaceholder}
              className="h-9 text-sm"
            />
            {url && (
              <button type="button" onClick={() => onUrlChange('')} className="shrink-0 text-muted-foreground hover:text-destructive transition-colors">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {url && (
            <div className="mt-2">
              <img
                src={url}
                alt="Preview"
                className={`h-16 w-full rounded-lg border bg-muted ${previewShape === 'cover' ? 'object-cover' : 'object-contain'}`}
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
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
              <FieldLabel>Company Name</FieldLabel>
              <Input
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
                <FieldLabel>URL Slug</FieldLabel>
                <Input placeholder="acme-pvt-ltd" className="h-10" {...form.register('slug')} />
                {e.slug ? (
                  <FieldError msg={e.slug.message} />
                ) : (
                  <p className="mt-1 text-[11px] text-muted-foreground">Login URL: /login?org={slug || 'slug'}</p>
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
            <FieldLabel optional>Employee Code Prefix</FieldLabel>
            <Input
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
            <FieldLabel optional>Primary Brand Colour</FieldLabel>
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
