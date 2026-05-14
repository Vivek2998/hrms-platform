import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { apiClient } from '@/lib/axios';
import { useAuthStore } from '@/stores/auth.store';
import type { UserRole, OrgPlan } from '@hrms/shared-types';

const schema = z
  .object({
    name: z.string().min(2, 'Company name must be at least 2 characters'),
    slug: z
      .string()
      .min(2, 'Slug must be at least 2 characters')
      .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, and hyphens only'),
    email: z.string().email('Enter a valid email'),
    adminFirstName: z.string().min(1, 'Required'),
    adminLastName: z.string().min(1, 'Required'),
    adminEmail: z.string().email('Enter a valid email'),
    adminPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.adminPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

interface RegisterResponse {
  accessToken: string;
  refreshToken: string;
  employee: {
    id: string;
    organizationId: string;
    orgName: string;
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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
      {children}
    </p>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{children}</p>
      <div className="h-px flex-1 bg-slate-100" />
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);
  const [serverError, setServerError] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      slug: '',
      email: '',
      adminFirstName: '',
      adminLastName: '',
      adminEmail: '',
      adminPassword: '',
      confirmPassword: '',
    },
  });

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  async function onSubmit(data: FormValues) {
    setServerError('');
    try {
      const { confirmPassword: _confirm, ...body } = data;
      const res = await apiClient.post<{ data: RegisterResponse }>('/auth/register', body);
      const { accessToken, refreshToken, employee } = res.data.data;
      setTokens(accessToken, refreshToken);
      setUser({
        id: employee.id,
        organizationId: employee.organizationId,
        orgName: employee.orgName,
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
    }
  }

  const slugValue = form.watch('slug');

  return (
    <AuthLayout variant="register">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create your account</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Set up your company and admin account — free forever on the Starter plan.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        {/* ── Company ── */}
        <div className="space-y-4">
          <SectionHeading>Company</SectionHeading>

          <div>
            <FieldLabel>Company Name</FieldLabel>
            <Input
              placeholder="Acme Pvt Ltd"
              className="h-10 border-slate-200 text-slate-900 placeholder:text-slate-400"
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
            {form.formState.errors.name && (
              <p className="mt-1 text-xs text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>URL Slug</FieldLabel>
              <Input
                placeholder="acme-pvt-ltd"
                className="h-10 border-slate-200 text-slate-900 placeholder:text-slate-400"
                {...form.register('slug')}
              />
              {form.formState.errors.slug ? (
                <p className="mt-1 text-xs text-red-500">{form.formState.errors.slug.message}</p>
              ) : (
                <p className="mt-1 text-[11px] text-slate-400">
                  Login URL: /login?org={slugValue || 'slug'}
                </p>
              )}
            </div>
            <div>
              <FieldLabel>Company Email</FieldLabel>
              <Input
                type="email"
                placeholder="hr@acme.in"
                className="h-10 border-slate-200 text-slate-900 placeholder:text-slate-400"
                {...form.register('email')}
              />
              {form.formState.errors.email && (
                <p className="mt-1 text-xs text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Admin account ── */}
        <div className="space-y-4">
          <SectionHeading>Your Account</SectionHeading>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>First Name</FieldLabel>
              <Input
                className="h-10 border-slate-200 text-slate-900"
                {...form.register('adminFirstName')}
              />
              {form.formState.errors.adminFirstName && (
                <p className="mt-1 text-xs text-red-500">
                  {form.formState.errors.adminFirstName.message}
                </p>
              )}
            </div>
            <div>
              <FieldLabel>Last Name</FieldLabel>
              <Input
                className="h-10 border-slate-200 text-slate-900"
                {...form.register('adminLastName')}
              />
              {form.formState.errors.adminLastName && (
                <p className="mt-1 text-xs text-red-500">
                  {form.formState.errors.adminLastName.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <FieldLabel>Work Email</FieldLabel>
            <Input
              type="email"
              placeholder="you@acme.in"
              className="h-10 border-slate-200 text-slate-900 placeholder:text-slate-400"
              {...form.register('adminEmail')}
            />
            {form.formState.errors.adminEmail && (
              <p className="mt-1 text-xs text-red-500">
                {form.formState.errors.adminEmail.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Password</FieldLabel>
              <Input
                type="password"
                placeholder="Min 8 characters"
                className="h-10 border-slate-200 text-slate-900 placeholder:text-slate-400"
                {...form.register('adminPassword')}
              />
              {form.formState.errors.adminPassword && (
                <p className="mt-1 text-xs text-red-500">
                  {form.formState.errors.adminPassword.message}
                </p>
              )}
            </div>
            <div>
              <FieldLabel>Confirm Password</FieldLabel>
              <Input
                type="password"
                className="h-10 border-slate-200 text-slate-900"
                {...form.register('confirmPassword')}
              />
              {form.formState.errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {serverError && (
          <p className="rounded-md bg-red-50 px-3 py-2.5 text-sm text-red-600">{serverError}</p>
        )}

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="h-10 w-full bg-slate-900 text-white hover:bg-slate-800"
        >
          {form.formState.isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Create Account — Free
        </Button>

        <p className="text-center text-xs text-slate-400">
          By creating an account, you agree to our{' '}
          <a href="#" className="text-slate-500 hover:text-slate-700 hover:underline">Terms of Service</a>{' '}
          and{' '}
          <a href="#" className="text-slate-500 hover:text-slate-700 hover:underline">Privacy Policy</a>.
        </p>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-100" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs text-slate-400">Already have an account?</span>
        </div>
      </div>

      <Link to="/login">
        <Button
          variant="outline"
          type="button"
          className="h-10 w-full border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          Sign in instead
        </Button>
      </Link>
    </AuthLayout>
  );
}
