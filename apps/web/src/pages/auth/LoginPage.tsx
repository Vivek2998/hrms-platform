import { useState } from 'react';
import { Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { useAuthStore } from '@/stores/auth.store';
import { useLogin, loginSchema, type LoginInput } from '@/hooks/useAuth';
import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@hrms/shared-types';

const forgotSchema = z.object({ email: z.string().email('Enter a valid email') });
type ForgotInput = z.infer<typeof forgotSchema>;

type View = 'login' | 'forgot' | 'forgot-sent';

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  );
}

export default function LoginPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [showPwd, setShowPwd] = useState(false);
  const [view, setView] = useState<View>('login');
  const { mutate: login, isPending } = useLogin();

  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const forgotForm = useForm<ForgotInput>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  async function onForgot(data: ForgotInput) {
    try {
      const res = await apiClient.post<ApiResponse<{ message: string; token?: string }>>(
        '/auth/forgot-password',
        data,
      );
      if (res.data.data.token) {
        const link = `${window.location.origin}/reset-password?token=${res.data.data.token}`;
        toast.info(`Dev mode — reset link: ${link}`, { duration: 15000 });
      }
      setView('forgot-sent');
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  }

  return (
    <AuthLayout variant="login">

      {/* ── Sign-in form ── */}
      {view === 'login' && (
        <div>
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          <form
            onSubmit={loginForm.handleSubmit((data) => { login(data); })}
            className="space-y-5"
          >
            <div>
              <FieldLabel>Work Email</FieldLabel>
              <Input
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                className="h-10 border-input text-foreground placeholder:text-muted-foreground"
                {...loginForm.register('email')}
              />
              {loginForm.formState.errors.email && (
                <p className="mt-1 text-xs text-red-500">
                  {loginForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <FieldLabel>Password</FieldLabel>
                <button
                  type="button"
                  onClick={() => { setView('forgot'); }}
                  className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-10 border-input pr-10 text-foreground placeholder:text-muted-foreground"
                  {...loginForm.register('password')}
                />
                <button
                  type="button"
                  onClick={() => { setShowPwd((v) => !v); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {loginForm.formState.errors.password && (
                <p className="mt-1 text-xs text-red-500">
                  {loginForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="h-10 w-full bg-foreground text-background hover:bg-foreground/90"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-xs text-muted-foreground">New to WorkAxis?</span>
            </div>
          </div>

          <Link to="/register">
            <Button
              variant="outline"
              type="button"
              className="h-10 w-full border-input text-foreground hover:bg-accent"
            >
              Create a company account
            </Button>
          </Link>
        </div>
      )}

      {/* ── Forgot password ── */}
      {view === 'forgot' && (
        <div>
          <button
            type="button"
            onClick={() => { setView('login'); }}
            className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </button>

          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Reset password</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Enter your work email and we&apos;ll send you a reset link.
            </p>
          </div>

          <form onSubmit={forgotForm.handleSubmit(onForgot)} className="space-y-5">
            <div>
              <FieldLabel>Work Email</FieldLabel>
              <Input
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                className="h-10 border-input text-foreground placeholder:text-muted-foreground"
                {...forgotForm.register('email')}
              />
              {forgotForm.formState.errors.email && (
                <p className="mt-1 text-xs text-red-500">
                  {forgotForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={forgotForm.formState.isSubmitting}
              className="h-10 w-full bg-foreground text-background hover:bg-foreground/90"
            >
              {forgotForm.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Send Reset Link
            </Button>
          </form>
        </div>
      )}

      {/* ── Email sent confirmation ── */}
      {view === 'forgot-sent' && (
        <div>
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-50">
              <CheckCircle2 className="h-7 w-7 text-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Check your email</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                If an account exists for that email, a password reset
                link has been sent.
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                In development mode the reset link appears in the notification above.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            className="mt-2 h-10 w-full border-input text-foreground hover:bg-accent"
            onClick={() => { setView('login'); }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to sign in
          </Button>
        </div>
      )}

    </AuthLayout>
  );
}
