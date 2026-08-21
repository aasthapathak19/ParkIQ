import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Mail, Phone, Camera, Save, Lock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/index';
import { usersApi } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/uiStore';

const profileSchema = z.object({
  name: z.string().min(2, 'Name too short'),
  phone: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const toast = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.me,
    queryFn: () => usersApi.getMe().then((r) => r.data.data),
  });

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: data?.name ?? user?.name ?? '', phone: data?.phone ?? '' },
    values: { name: data?.name ?? '', phone: data?.phone ?? '' },
  });

  const { mutate: save, isPending } = useMutation({
    mutationFn: (d: ProfileForm) => usersApi.updateMe(d).then((r) => r.data.data),
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      qc.invalidateQueries({ queryKey: queryKeys.me });
      toast.success('Profile updated!');
    },
    onError: () => toast.error('Could not update profile.'),
  });

  const currentUser = data ?? user;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Profile</h1>
          <p className="text-sm text-neutral-400">Manage your account settings</p>
        </div>

        {/* Avatar */}
        <div className="glass rounded-xl p-6 border border-white/5 flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-indigo-500/30 flex items-center justify-center ring-2 ring-emerald-500/20">
              <User className="w-10 h-10 text-emerald-400" />
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center hover:bg-emerald-600 transition-colors">
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <div>
            <p className="font-bold text-white text-lg">{currentUser?.name}</p>
            <p className="text-sm text-neutral-400">{currentUser?.email}</p>
            <span className="badge badge-green text-xs mt-1 capitalize">{currentUser?.role}</span>
          </div>
        </div>

        {/* Form */}
        {isLoading ? (
          <div className="space-y-3"><Skeleton className="h-14 rounded-xl" /><Skeleton className="h-14 rounded-xl" /></div>
        ) : (
          <form onSubmit={handleSubmit((d) => save(d))} className="glass rounded-xl p-6 border border-white/5 space-y-4">
            <h3 className="font-semibold text-white">Personal Information</h3>
            <Input label="Full name" leftIcon={<User className="w-4 h-4" />} error={errors.name?.message} {...register('name')} />
            <Input label="Email" type="email" leftIcon={<Mail className="w-4 h-4" />} value={currentUser?.email ?? ''} disabled className="opacity-60 cursor-not-allowed" />
            <Input label="Phone number" type="tel" leftIcon={<Phone className="w-4 h-4" />} placeholder="+91 98765 43210" error={errors.phone?.message} {...register('phone')} />
            <Button type="submit" loading={isPending} disabled={!isDirty} leftIcon={<Save className="w-4 h-4" />}>Save Changes</Button>
          </form>
        )}

        {/* Security */}
        <div className="glass rounded-xl p-6 border border-white/5 space-y-3">
          <h3 className="font-semibold text-white">Security</h3>
          <p className="text-sm text-neutral-400">Change your password to keep your account secure.</p>
          <Button variant="secondary" leftIcon={<Lock className="w-4 h-4" />}>Change Password</Button>
        </div>

        {/* Danger */}
        <div className="rounded-xl p-6 border border-red-500/20 bg-red-500/5 space-y-3">
          <h3 className="font-semibold text-red-400">Danger Zone</h3>
          <p className="text-sm text-neutral-400">Permanently delete your account and all associated data.</p>
          <Button variant="danger">Delete Account</Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
