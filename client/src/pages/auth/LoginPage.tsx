import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/uiStore';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();
  const toast = useToast();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const { mutate: login, isPending } = useMutation({
    mutationFn: (data: FormData) => authApi.login(data).then((r) => r.data.data),
    onSuccess: (data) => {
      setAuth(data.user, data.tokens.accessToken, data.tokens.refreshToken);
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`);
      // Redirect based on role
      const roleRedirect = {
        customer: from !== '/' ? from : '/',
        owner: '/owner/dashboard',
        admin: '/admin/dashboard',
      };
      navigate(roleRedirect[data.user.role], { replace: true });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Login failed';
      toast.error(msg);
    },
  });

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your ParkIQ account">
      <form onSubmit={handleSubmit((d) => login(d))} className="space-y-5">
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Your password"
          leftIcon={<Lock className="w-4 h-4" />}
          rightIcon={
            <button type="button" onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded" />
            <span className="text-sm text-neutral-400">Remember me</span>
          </label>
          <Link to="/forgot-password" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" loading={isPending}>
          Sign In
        </Button>

        <div className="relative flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-neutral-500">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <p className="text-center text-sm text-neutral-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
            Create one free
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
