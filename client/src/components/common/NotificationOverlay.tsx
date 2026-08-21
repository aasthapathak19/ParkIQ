import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, X, Check, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import { INotification } from '@/types';

interface Props {
  unreadCount: number;
}

export const NotificationOverlay: React.FC<Props> = ({ unreadCount }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => notificationsApi.getAll({ limit: 5 }).then((r) => r.data.data),
    enabled: isOpen,
  });

  const { mutate: markRead } = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications });
      qc.invalidateQueries({ queryKey: queryKeys.unreadCount });
    },
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const notifications = data?.results || [];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center shadow-lg shadow-emerald-500/20">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 glass border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
          >
            <div className="p-3 border-b border-white/10 flex items-center justify-between bg-dark-900/50">
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              <button onClick={() => setIsOpen(false)} className="text-neutral-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-neutral-500">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-neutral-500">No new notifications.</div>
              ) : (
                notifications.map((notif: INotification) => (
                  <div
                    key={notif._id}
                    className={`p-3 rounded-lg text-sm transition-colors flex gap-3 ${
                      !notif.read ? 'bg-white/5 border border-white/5' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-200">{notif.title}</p>
                      <p className="text-neutral-400 text-xs truncate mt-0.5">{notif.message}</p>
                      <p className="text-[10px] text-neutral-500 mt-1">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {!notif.read && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markRead(notif._id); }}
                        className="text-emerald-400 hover:text-emerald-300 p-1 rounded hover:bg-emerald-400/10 shrink-0 self-start"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="block p-3 text-center text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-dark-900/50 hover:bg-dark-900 transition-colors border-t border-white/10 flex items-center justify-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
