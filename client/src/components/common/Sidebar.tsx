import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home, Search, CalendarCheck, Car, Heart, User,
  LayoutDashboard, ParkingSquare, SlotMachine, BookOpen, BarChart2,
  Users, ShieldCheck, TrendingUp, X
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const customerLinks: NavItem[] = [
  { to: '/', icon: <Home className="w-4 h-4" />, label: 'Home' },
  { to: '/search', icon: <Search className="w-4 h-4" />, label: 'Find Parking' },
  { to: '/bookings', icon: <CalendarCheck className="w-4 h-4" />, label: 'My Bookings' },
  { to: '/vehicles', icon: <Car className="w-4 h-4" />, label: 'My Vehicles' },
  { to: '/favourites', icon: <Heart className="w-4 h-4" />, label: 'Favourites' },
  { to: '/profile', icon: <User className="w-4 h-4" />, label: 'Profile' },
];

const ownerLinks: NavItem[] = [
  { to: '/owner/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard' },
  { to: '/owner/lots', icon: <ParkingSquare className="w-4 h-4" />, label: 'My Lots' },
  { to: '/owner/slots', icon: <BookOpen className="w-4 h-4" />, label: 'Slot Manager' },
  { to: '/owner/bookings', icon: <CalendarCheck className="w-4 h-4" />, label: 'Bookings' },
  { to: '/owner/revenue', icon: <BarChart2 className="w-4 h-4" />, label: 'Revenue' },
  { to: '/profile', icon: <User className="w-4 h-4" />, label: 'Profile' },
];

const adminLinks: NavItem[] = [
  { to: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard' },
  { to: '/admin/users', icon: <Users className="w-4 h-4" />, label: 'Users' },
  { to: '/admin/approvals', icon: <ShieldCheck className="w-4 h-4" />, label: 'Approvals' },
  { to: '/admin/analytics', icon: <TrendingUp className="w-4 h-4" />, label: 'Analytics' },
  { to: '/profile', icon: <User className="w-4 h-4" />, label: 'Profile' },
];

export const Sidebar: React.FC = () => {
  const { user } = useAuthStore();
  const { sidebarOpen, setSidebar } = useUIStore();

  const links = user?.role === 'admin' ? adminLinks
    : user?.role === 'owner' ? ownerLinks
    : customerLinks;

  const roleBadge = { customer: 'Customer', owner: 'Lot Owner', admin: 'Admin' };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/60 lg:hidden"
            onClick={() => setSidebar(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 224 : 0, opacity: sidebarOpen ? 1 : 0 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="fixed left-0 top-14 bottom-0 z-30 overflow-hidden glass-dark border-r border-white/5 lg:relative lg:top-0"
      >
        <div className="w-56 h-full flex flex-col py-4 px-3">
          {/* Role badge */}
          {user && (
            <div className="mb-4 px-2">
              <span className="badge badge-green text-xs">{roleBadge[user.role]}</span>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                {link.icon}
                <span>{link.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Close button (mobile) */}
          <button
            onClick={() => setSidebar(false)}
            className="lg:hidden mt-4 sidebar-link w-full"
          >
            <X className="w-4 h-4" />
            <span>Close</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
};
