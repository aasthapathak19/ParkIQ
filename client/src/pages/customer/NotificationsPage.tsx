import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Trash2, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Skeleton, EmptyState } from '@/components/ui/index';
import { notificationsApi } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/stores/uiStore';
import { INotification } from '@/types';

const priorityColor: Record<string, string> = {
  critical: 'border-l-red-500',
  high: 'border-l-amber-500',
  medium: 'border-l-emerald-500',
  low: 'border-l-neutral-500',
};

const NotificationsPage: React.FC = () => {
  const toast = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.notifications(),
    queryFn: () => notificationsApi.getAll({ limit: 20 }).then((r) => r.data.data),
  });

  const { mutate: markAllRead } = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.notifications() }); qc.invalidateQueries({ queryKey: queryKeys.unreadCount }); },
  });

  const { mutate: markRead } = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.notifications() }); qc.invalidateQueries({ queryKey: queryKeys.unreadCount }); },
  });

  const { mutate: deleteNotif } = useMutation({
    mutationFn: (id: string) => notificationsApi.delete(id),
    onSuccess: () => { toast.success('Notification deleted'); qc.invalidateQueries({ queryKey: queryKeys.notifications() }); },
  });

  const notifications = data?.data ?? [];
  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            {unread > 0 && <p className="text-sm text-emerald-400">{unread} unread</p>}
          </div>
          {unread > 0 && (
            <Button variant="secondary" size="sm" leftIcon={<CheckCheck className="w-4 h-4" />} onClick={() => markAllRead()}>
              Mark all read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        ) : notifications.length === 0 ? (
          <EmptyState icon={<Bell className="w-16 h-16" />} title="All caught up!" description="No notifications right now." />
        ) : (
          <div className="space-y-2">
            {notifications.map((n, i) => <NotifItem key={n._id} notif={n} index={i} onRead={() => markRead(n._id)} onDelete={() => deleteNotif(n._id)} />)}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

const NotifItem: React.FC<{
  notif: INotification; index: number;
  onRead: () => void; onDelete: () => void;
}> = ({ notif, index, onRead, onDelete }) => (
  <motion.div
    initial={{ opacity: 0, x: -12 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.04 }}
    className={`glass rounded-xl p-4 border border-white/5 border-l-2 flex items-start gap-3 ${priorityColor[notif.priority]} ${!notif.isRead ? 'bg-emerald-500/5' : ''}`}
  >
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-medium ${!notif.isRead ? 'text-white' : 'text-neutral-300'}`}>{notif.title}</p>
      <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">{notif.body}</p>
      <p className="text-xs text-neutral-600 mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
    </div>
    <div className="flex items-center gap-1 shrink-0">
      {!notif.isRead && (
        <button onClick={onRead} title="Mark as read" className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-neutral-500 hover:text-emerald-400 transition-colors">
          <Check className="w-3.5 h-3.5" />
        </button>
      )}
      <button onClick={onDelete} title="Delete" className="p-1.5 rounded-lg hover:bg-red-500/10 text-neutral-500 hover:text-red-400 transition-colors">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  </motion.div>
);

export default NotificationsPage;
