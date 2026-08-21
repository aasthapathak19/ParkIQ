import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/services/api';
import { useToast } from '@/stores/uiStore';

const schema = z.object({ email: z.string().email('Enter a valid email') });
type FormData = z.infer<typeof schema>;

const ForgotPasswordPage: React.FC = () => {
  const [sent, setSent] = useState(false);
  const toast = useToast();

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { mutate: sendReset, isPending } = useMutation({
    mutationFn: (data: FormData) => authApi.forgotPassword(data.email),
    onSuccess: () => setSent(true),
    onError: () => toast.error('Something went wrong. Please try again.'),
  });

  if (sent) {
    return (
      <AuthLayout title="Check your email" subtitle="We've sent you a reset link">
        <div className="text-center space-y-4">
          <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto" />
          <p className="text-neutral-300 text-sm">
            We sent a password reset link to <strong>{getValues('email')}</strong>.
            Check your inbox and click the link to reset your password.
          </p>
          <p className="text-xs text-neutral-500">Didn't receive it? Check spam or try again in a few minutes.</p>
          <Link to="/login" className="btn-secondary inline-flex mt-4">
            <ArrowLeft className="w-4 h-4" /> Back to Sign In
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot password?" subtitle="Enter your email and we'll send you a reset link">
      <form onSubmit={handleSubmit((d) => sendReset(d))} className="space-y-5">
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Button type="submit" className="w-full" loading={isPending}>
          Send Reset Link
        </Button>

        <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-neutral-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Sign In
        </Link>
      </form>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
