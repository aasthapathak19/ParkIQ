import React, { Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Spinner } from '@/components/ui/index';

// ─── Lazy loaded pages ────────────────────────────────────────────────────────
const HomePage = lazy(() => import('@/pages/customer/HomePage'));
const SearchPage = lazy(() => import('@/pages/customer/SearchPage'));
const ParkingDetailPage = lazy(() => import('@/pages/customer/ParkingDetailPage'));
const BookingHistoryPage = lazy(() => import('@/pages/customer/BookingHistoryPage'));
const BookingDetailPage = lazy(() => import('@/pages/customer/BookingDetailPage'));
const VehiclesPage = lazy(() => import('@/pages/customer/VehiclesPage'));
const FavouritesPage = lazy(() => import('@/pages/customer/FavouritesPage'));
const ProfilePage = lazy(() => import('@/pages/customer/ProfilePage'));
const NotificationsPage = lazy(() => import('@/pages/customer/NotificationsPage'));

const OwnerDashboardPage = lazy(() => import('@/pages/owner/OwnerDashboardPage'));
const ParkingManagePage = lazy(() => import('@/pages/owner/ParkingManagePage'));
const OwnerBookingsPage = lazy(() => import('@/pages/owner/OwnerBookingsPage'));
const RevenuePage = lazy(() => import('@/pages/owner/RevenuePage'));

const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'));
const ApprovalsPage = lazy(() => import('@/pages/admin/ApprovalsPage'));
const AdminAnalyticsPage = lazy(() => import('@/pages/admin/AdminAnalyticsPage'));

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));

// ─── Query Client ─────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 2,
    },
  },
});

// ─── Page Loader ──────────────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-neutral-500">Loading...</p>
    </div>
  </div>
);

import { Toaster } from 'react-hot-toast';
import { SocketProvider } from '@/contexts/SocketContext';
import { useSocketEvents } from '@/hooks/useSocketEvents';

// Component to initialize socket events at the root
const GlobalSocketListener = () => {
  useSocketEvents();
  return null;
};

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <GlobalSocketListener />
          <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* ── Public ── */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/parking/:id" element={<ParkingDetailPage />} />
              <Route path="/search" element={<SearchPage />} />

              {/* ── Customer ── */}
              <Route path="/bookings" element={<ProtectedRoute roles={['customer']}><BookingHistoryPage /></ProtectedRoute>} />
              <Route path="/bookings/:id" element={<ProtectedRoute roles={['customer']}><BookingDetailPage /></ProtectedRoute>} />
              <Route path="/vehicles" element={<ProtectedRoute roles={['customer']}><VehiclesPage /></ProtectedRoute>} />
              <Route path="/favourites" element={<ProtectedRoute roles={['customer']}><FavouritesPage /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

              {/* ── Owner ── */}
              <Route path="/owner/dashboard" element={<ProtectedRoute roles={['owner']}><OwnerDashboardPage /></ProtectedRoute>} />
              <Route path="/owner/lots" element={<ProtectedRoute roles={['owner']}><ParkingManagePage /></ProtectedRoute>} />
              <Route path="/owner/bookings" element={<ProtectedRoute roles={['owner']}><OwnerBookingsPage /></ProtectedRoute>} />
              <Route path="/owner/slots" element={<ProtectedRoute roles={['owner']}><OwnerBookingsPage /></ProtectedRoute>} />
              <Route path="/owner/revenue" element={<ProtectedRoute roles={['owner']}><RevenuePage /></ProtectedRoute>} />

              {/* ── Admin ── */}
              <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboardPage /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsersPage /></ProtectedRoute>} />
              <Route path="/admin/approvals" element={<ProtectedRoute roles={['admin']}><ApprovalsPage /></ProtectedRoute>} />
              <Route path="/admin/analytics" element={<ProtectedRoute roles={['admin']}><AdminAnalyticsPage /></ProtectedRoute>} />

              {/* ── 404 Fallback ── */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />
        <Toaster position="top-right" />
        </SocketProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
