import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="bg-muted/40 flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="bg-primary h-12 w-12 rounded-xl" />
          <h1 className="text-2xl font-bold">HRMS Platform</h1>
          <p className="text-muted-foreground text-sm">
            Start managing your team today — free
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create your account</CardTitle>
            <CardDescription>Set up your company and admin account in one step</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Company section */}
              <div className="space-y-3">
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                  Company
                </p>

                <div className="space-y-1.5">
                  <Label htmlFor="name">Company Name</Label>
                  <Input
                    id="name"
                    placeholder="Acme Pvt Ltd"
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
                    <p className="text-destructive text-xs">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="slug">URL Slug</Label>
                    <Input id="slug" placeholder="acme-pvt-ltd" {...form.register('slug')} />
                    {form.formState.errors.slug ? (
                      <p className="text-destructive text-xs">
                        {form.formState.errors.slug.message}
                      </p>
                    ) : (
                      <p className="text-muted-foreground text-xs">
                        Login: /login?org={slugValue || 'slug'}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Company Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="hr@acme.in"
                      {...form.register('email')}
                    />
                    {form.formState.errors.email && (
                      <p className="text-destructive text-xs">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Admin account section */}
              <div className="space-y-3">
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                  Your Account
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="adminFirstName">First Name</Label>
                    <Input id="adminFirstName" {...form.register('adminFirstName')} />
                    {form.formState.errors.adminFirstName && (
                      <p className="text-destructive text-xs">
                        {form.formState.errors.adminFirstName.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="adminLastName">Last Name</Label>
                    <Input id="adminLastName" {...form.register('adminLastName')} />
                    {form.formState.errors.adminLastName && (
                      <p className="text-destructive text-xs">
                        {form.formState.errors.adminLastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="adminEmail">Work Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="you@acme.in"
                    {...form.register('adminEmail')}
                  />
                  {form.formState.errors.adminEmail && (
                    <p className="text-destructive text-xs">
                      {form.formState.errors.adminEmail.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="adminPassword">Password</Label>
                    <Input
                      id="adminPassword"
                      type="password"
                      placeholder="Min 8 characters"
                      {...form.register('adminPassword')}
                    />
                    {form.formState.errors.adminPassword && (
                      <p className="text-destructive text-xs">
                        {form.formState.errors.adminPassword.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...form.register('confirmPassword')}
                    />
                    {form.formState.errors.confirmPassword && (
                      <p className="text-destructive text-xs">
                        {form.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {serverError && <p className="text-destructive text-sm">{serverError}</p>}

              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Account — Free
              </Button>

              <p className="text-muted-foreground text-center text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
