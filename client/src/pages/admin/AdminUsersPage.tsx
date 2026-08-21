import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, UserCheck, UserX, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Input, Select } from '@/components/ui/Input';
import { Badge, statusVariant, Skeleton, EmptyState } from '@/components/ui/index';
import { Button } from '@/components/ui/Button';
import { usersApi } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/stores/uiStore';
import { IUser } from '@/types';

const AdminUsersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const toast = useToast();
  const qc = useQueryClient();

  const params = { role: roleFilter || undefined, page, limit: 15, search: search || undefined };

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.adminUsers(params),
    queryFn: () => usersApi.getAllUsers(params).then((r) => r.data.data),
    placeholderData: (prev) => prev,
  });

  const { mutate: toggleStatus } = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      usersApi.updateUserStatus(id, { isActive }),
    onSuccess: () => { toast.success('User status updated'); qc.invalidateQueries({ queryKey: ['admin', 'users'] }); },
    onError: () => toast.error('Could not update user status.'),
  });

  const { mutate: toggleSuspend } = useMutation({
    mutationFn: ({ id, isSuspended }: { id: string; isSuspended: boolean }) =>
      usersApi.updateUserStatus(id, { isSuspended }),
    onSuccess: () => { toast.success('User suspension updated'); qc.invalidateQueries({ queryKey: ['admin', 'users'] }); },
  });

  const users = (data as { data: IUser[]; pagination: unknown })?.data ?? [];
  const pagination = (data as { data: IUser[]; pagination: { page: number; totalPages: number; hasNextPage: boolean; hasPrevPage: boolean } } | undefined)?.pagination;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-sm text-neutral-400">View and manage all platform users</p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Input
            placeholder="Search by name or email..."
            leftIcon={<Search className="w-4 h-4" />}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="flex-1 min-w-48"
          />
          <Select
            options={[
              { value: '', label: 'All roles' },
              { value: 'customer', label: 'Customer' },
              { value: 'owner', label: 'Owner' },
              { value: 'admin', label: 'Admin' },
            ]}
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="w-36"
          />
        </div>

        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        ) : users.length === 0 ? (
          <EmptyState icon={<Users className="w-16 h-16" />} title="No users found" description="Try adjusting your search or filters." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-neutral-500 uppercase tracking-wider border-b border-white/5">
                    <th className="pb-3 pr-4">User</th>
                    <th className="pb-3 pr-4">Role</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Joined</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((user, i) => (
                    <motion.tr
                      key={user._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-white/2"
                    >
                      <td className="py-3 pr-4">
                        <div>
                          <p className="text-sm font-medium text-white">{user.name}</p>
                          <p className="text-xs text-neutral-500">{user.email}</p>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`badge ${user.role === 'admin' ? 'badge-red' : user.role === 'owner' ? 'badge-blue' : 'badge-green'}`}>{user.role}</span>
                      </td>
                      <td className="py-3 pr-4">
                        {user.isSuspended ? <Badge variant="red">Suspended</Badge>
                          : user.isActive ? <Badge variant="green">Active</Badge>
                          : <Badge variant="gray">Inactive</Badge>}
                      </td>
                      <td className="py-3 pr-4 text-xs text-neutral-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => toggleStatus({ id: user._id, isActive: !user.isActive })}
                            title={user.isActive ? 'Deactivate' : 'Activate'}
                            className={`p-1.5 rounded-lg transition-colors ${user.isActive ? 'hover:bg-amber-500/10 text-neutral-400 hover:text-amber-400' : 'hover:bg-emerald-500/10 text-neutral-400 hover:text-emerald-400'}`}
                          >
                            {user.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center gap-3 pt-2">
                <Button variant="secondary" size="sm" disabled={!pagination.hasPrevPage} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <span className="text-sm text-neutral-400 self-center">{pagination.page}/{pagination.totalPages}</span>
                <Button variant="secondary" size="sm" disabled={!pagination.hasNextPage} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminUsersPage;
