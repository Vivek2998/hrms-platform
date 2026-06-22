import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@hrms/shared-types';

const resetSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });
type ResetInput = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [showPwd, setShowPwd] = useState(false);
  const [done, setDone] = useState(false);

  const form = useForm<ResetInput>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirm: '' },
  });

  async function onSubmit(data: ResetInput) {
    try {
      await apiClient.post<ApiResponse<{ message: string }>>('/auth/reset-password', {
        token,
        password: data.password,
      });
      setDone(true);
    } catch {
      toast.error('Invalid or expired reset link. Please request a new one.');
    }
  }

  if (!token) {
    return (
      <div className="bg-muted/40 flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Invalid reset link.</p>
            <Link to="/login" className="text-primary mt-2 block text-sm hover:underline">
              Back to login
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-muted/40 flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="bg-primary h-12 w-12 rounded-xl" />
          <h1 className="text-2xl font-bold">HRMS Platform</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Set new password</CardTitle>
            <CardDescription>Choose a strong password for your account</CardDescription>
          </CardHeader>
          <CardContent>
            {done ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle2 className="text-green-500 h-12 w-12" />
                <p className="font-medium">Password reset successfully!</p>
                <Link to="/login">
                  <Button className="mt-2">Sign in</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPwd ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      {...form.register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => { setShowPwd((v) => !v); }}
                      className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2"
                      aria-label={showPwd ? 'Hide' : 'Show'}
                    >
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {form.formState.errors.password && (
                    <p className="text-destructive text-xs">{form.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm Password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    {...form.register('confirm')}
                  />
                  {form.formState.errors.confirm && (
                    <p className="text-destructive text-xs">{form.formState.errors.confirm.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Reset Password
                </Button>

                <p className="text-center">
                  <Link to="/login" className="text-muted-foreground text-sm hover:underline">
                    Back to login
                  </Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
