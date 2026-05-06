import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth.store';
import { useLogin, loginSchema, type LoginInput } from '@/hooks/useAuth';
import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@hrms/shared-types';

const forgotSchema = z.object({ email: z.string().email('Enter a valid email') });
type ForgotInput = z.infer<typeof forgotSchema>;

type View = 'login' | 'forgot' | 'forgot-sent';

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
      // In development the token is returned directly; show the reset link
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
    <div className="bg-muted/40 flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="bg-primary h-12 w-12 rounded-xl" />
          <h1 className="text-2xl font-bold">HRMS Platform</h1>
          <p className="text-muted-foreground text-sm">
            Complete HR Management for Indian Businesses
          </p>
        </div>

        <Card>
          {view === 'login' && (
            <>
              <CardHeader>
                <CardTitle>Sign in to your account</CardTitle>
                <CardDescription>Enter your work email and password to continue</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={loginForm.handleSubmit((data) => { login(data); })}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="email">Work Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      autoComplete="email"
                      {...loginForm.register('email')}
                    />
                    {loginForm.formState.errors.email && (
                      <p className="text-destructive text-xs">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <button
                        type="button"
                        onClick={() => { setView('forgot'); }}
                        className="text-primary text-xs hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPwd ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        {...loginForm.register('password')}
                      />
                      <button
                        type="button"
                        onClick={() => { setShowPwd((v) => !v); }}
                        className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2"
                        aria-label={showPwd ? 'Hide password' : 'Show password'}
                      >
                        {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-destructive text-xs">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </CardContent>
            </>
          )}

          {view === 'forgot' && (
            <>
              <CardHeader>
                <CardTitle>Reset your password</CardTitle>
                <CardDescription>
                  Enter your work email and we'll send you a reset link
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={forgotForm.handleSubmit(onForgot)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Work Email</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="you@company.com"
                      autoComplete="email"
                      {...forgotForm.register('email')}
                    />
                    {forgotForm.formState.errors.email && (
                      <p className="text-destructive text-xs">{forgotForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={forgotForm.formState.isSubmitting}>
                    {forgotForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Reset Link
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => { setView('login'); }}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to sign in
                  </Button>
                </form>
              </CardContent>
            </>
          )}

          {view === 'forgot-sent' && (
            <>
              <CardHeader>
                <CardTitle>Check your email</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <CheckCircle2 className="text-green-500 h-12 w-12" />
                  <p className="text-muted-foreground text-sm">
                    If an account exists for that email, a password reset link has been sent.
                  </p>
                  <p className="text-muted-foreground text-xs">
                    In development mode, the reset link is shown in a notification above.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => { setView('login'); }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to sign in
                </Button>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
