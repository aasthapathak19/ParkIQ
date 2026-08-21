import React from 'react';
import { Navbar } from '@/components/common/Navbar';
import { Sidebar } from '@/components/common/Sidebar';
import { Toaster } from '@/components/ui/Toaster';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => (
  <div className="min-h-screen flex flex-col" style={{ background: 'var(--clr-dark-900)' }}>
    <Navbar />
    <div className="flex flex-1 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 page-enter">
        {children}
      </main>
    </div>
    <Toaster />
  </div>
);

export const PublicLayout: React.FC<DashboardLayoutProps> = ({ children }) => (
  <div className="min-h-screen flex flex-col" style={{ background: 'var(--clr-dark-900)' }}>
    <Navbar />
    <main className="flex-1 page-enter">
      {children}
    </main>
    <Toaster />
  </div>
);
