import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Lock, Phone, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/uiStore';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  phone: z.string().optional(),
  role: z.enum(['customer', 'owner']),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

const RegisterPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'customer' },
  });

  const { mutate: registerUser, isPending } = useMutation({
    mutationFn: (data: FormData) => authApi.register(data).then((r) => r.data.data),
    onSuccess: (data) => {
      setAuth(data.user, data.tokens.accessToken, data.tokens.refreshToken);
      toast.success('Account created! Welcome to ParkIQ.');
      const roleRedirect = { customer: '/', owner: '/owner/dashboard', admin: '/admin/dashboard' };
      navigate(roleRedirect[data.user.role], { replace: true });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Registration failed';
      toast.error(msg);
    },
  });

  return (
    <AuthLayout title="Create account" subtitle="Join ParkIQ and park smarter">
      <form onSubmit={handleSubmit((d) => registerUser(d))} className="space-y-4">
        <Input
          label="Full name"
          type="text"
          placeholder="John Doe"
          leftIcon={<User className="w-4 h-4" />}
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Phone (optional)"
          type="tel"
          placeholder="+91 98765 43210"
          leftIcon={<Phone className="w-4 h-4" />}
          error={errors.phone?.message}
          {...register('phone')}
        />

        <Select
          label="I want to"
          options={[
            { value: 'customer', label: '🚗  Park my vehicle (Customer)' },
            { value: 'owner', label: '🏢  List my parking lot (Owner)' },
          ]}
          error={errors.role?.message}
          {...register('role')}
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Min. 8 characters"
          leftIcon={<Lock className="w-4 h-4" />}
          rightIcon={
            <button type="button" onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Repeat your password"
          leftIcon={<Lock className="w-4 h-4" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <p className="text-xs text-neutral-500">
          By creating an account you agree to our{' '}
          <span className="text-emerald-400 cursor-pointer">Terms</span> and{' '}
          <span className="text-emerald-400 cursor-pointer">Privacy Policy</span>.
        </p>

        <Button type="submit" className="w-full" loading={isPending}>
          Create Account
        </Button>

        <p className="text-center text-sm text-neutral-400">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;
