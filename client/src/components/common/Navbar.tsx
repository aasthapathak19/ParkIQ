import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ParkingSquare, Bell, Menu, LogOut, User } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import { NotificationOverlay } from './NotificationOverlay';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const navigate = useNavigate();

  const { data: unreadData } = useQuery({
    queryKey: queryKeys.unreadCount,
    queryFn: () => notificationsApi.getUnreadCount().then((r) => r.data.data),
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="glass-dark sticky top-0 z-40 border-b border-white/5 h-14 flex items-center px-4 gap-4">
      {/* Sidebar Toggle */}
      {isAuthenticated && (
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mr-auto">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-indigo-500 flex items-center justify-center">
          <ParkingSquare className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-white text-lg hidden sm:block" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          ParkIQ <span className="gradient-text">AI</span>
        </span>
      </Link>

      {isAuthenticated && user ? (
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <NotificationOverlay unreadCount={unreadData?.count ?? 0} />

          {/* Profile */}
          <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/30" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/30 to-indigo-500/30 flex items-center justify-center ring-2 ring-emerald-500/20">
                <User className="w-4 h-4 text-emerald-400" />
              </div>
            )}
            <span className="text-sm font-medium text-neutral-200 hidden sm:block">{user.name.split(' ')[0]}</span>
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-red-500/10 text-neutral-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Link to="/login" className="btn-secondary text-sm px-4 py-2">Sign In</Link>
          <Link to="/register" className="btn-primary text-sm px-4 py-2">Get Started</Link>
        </div>
      )}
    </nav>
  );
};
