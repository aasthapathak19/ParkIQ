import api from '@/lib/axios';
import {
  AuthResponse, IUser, IVehicle, IParkingLot, ISlot,
  IBooking, INotification, PaginatedResult, ApiResponse, SearchParams,
} from '@/types';

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string; role?: string; phone?: string }) =>
    api.post<ApiResponse<AuthResponse>>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', data),

  logout: () => api.post('/auth/logout'),

  refresh: (refreshToken: string) =>
    api.post<ApiResponse<{ tokens: { accessToken: string; refreshToken: string } }>>('/auth/refresh', { refreshToken }),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post(`/auth/reset-password/${token}`, { password }),
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersApi = {
  getMe: () => api.get<ApiResponse<IUser>>('/users/me'),

  updateMe: (data: Partial<IUser>) =>
    api.put<ApiResponse<IUser>>('/users/me', data),

  deleteMe: () => api.delete('/users/me'),

  // Admin
  getAllUsers: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<PaginatedResult<IUser>>>('/users', { params }),

  updateUserStatus: (id: string, data: { isActive?: boolean; isSuspended?: boolean }) =>
    api.put<ApiResponse<IUser>>(`/users/${id}/status`, data),
};

// ─── Vehicles ─────────────────────────────────────────────────────────────────
export const vehiclesApi = {
  getAll: () => api.get<ApiResponse<IVehicle[]>>('/vehicles'),

  getById: (id: string) => api.get<ApiResponse<IVehicle>>(`/vehicles/${id}`),

  create: (data: Partial<IVehicle>) =>
    api.post<ApiResponse<IVehicle>>('/vehicles', data),

  update: (id: string, data: Partial<IVehicle>) =>
    api.put<ApiResponse<IVehicle>>(`/vehicles/${id}`, data),

  delete: (id: string) => api.delete(`/vehicles/${id}`),

  setDefault: (id: string) => api.put(`/vehicles/${id}/default`),
};

// ─── Parking ──────────────────────────────────────────────────────────────────
export const parkingApi = {
  search: (params: SearchParams) =>
    api.get<ApiResponse<PaginatedResult<IParkingLot>>>('/parking', { params }),

  nearby: (lat: number, lng: number, radius = 5000) =>
    api.get<ApiResponse<IParkingLot[]>>('/parking/nearby', { params: { lat, lng, radius } }),

  getById: (id: string) => api.get<ApiResponse<IParkingLot>>(`/parking/${id}`),

  // Owner
  getMyLots: () => api.get<ApiResponse<IParkingLot[]>>('/parking/my-lots'),

  create: (data: Partial<IParkingLot>) =>
    api.post<ApiResponse<IParkingLot>>('/parking', data),

  update: (id: string, data: Partial<IParkingLot>) =>
    api.put<ApiResponse<IParkingLot>>(`/parking/${id}`, data),

  delete: (id: string) => api.delete(`/parking/${id}`),

  // Favourites
  getFavourites: () => api.get<ApiResponse<IParkingLot[]>>('/parking/favourites'),
  addFavourite: (id: string) => api.post(`/parking/${id}/favourite`),
  removeFavourite: (id: string) => api.delete(`/parking/${id}/favourite`),

  // Admin
  approveLot: (id: string) => api.put(`/parking/${id}/approve`),
  rejectLot: (id: string, reason: string) =>
    api.put(`/parking/${id}/reject`, { reason }),
};

// ─── Slots ────────────────────────────────────────────────────────────────────
export const slotsApi = {
  getByLot: (parkingId: string) =>
    api.get<ApiResponse<ISlot[]>>(`/parking/${parkingId}/slots`),

  create: (parkingId: string, data: Partial<ISlot>[]) =>
    api.post<ApiResponse<ISlot[]>>(`/parking/${parkingId}/slots/bulk`, data),

  update: (parkingId: string, id: string, data: Partial<ISlot>) =>
    api.put<ApiResponse<ISlot>>(`/parking/${parkingId}/slots/${id}`, data),

  delete: (parkingId: string, id: string) =>
    api.delete(`/parking/${parkingId}/slots/${id}`),
};

// ─── Bookings ─────────────────────────────────────────────────────────────────
export const bookingsApi = {
  create: (data: {
    vehicleId: string;
    parkingLotId: string;
    slotId: string;
    startTime: string;
    endTime: string;
  }) => api.post<ApiResponse<IBooking>>('/bookings', data),

  getMyBookings: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get<ApiResponse<PaginatedResult<IBooking>>>('/bookings', { params }),

  getById: (id: string) => api.get<ApiResponse<IBooking>>(`/bookings/${id}`),

  cancel: (id: string, reason?: string) =>
    api.put<ApiResponse<IBooking>>(`/bookings/${id}/cancel`, { reason }),

  getQR: (id: string) => api.get<ApiResponse<{ qrCode: string }>>(`/bookings/${id}/qr`),

  getPriceEstimate: (data: { lotId: string; startTime: string; endTime: string }) =>
    api.post<ApiResponse<Record<string, unknown>>>('/bookings/price-estimate', data),

  // Owner
  getOwnerBookings: (lotId: string, params?: { status?: string; page?: number }) =>
    api.get<ApiResponse<PaginatedResult<IBooking>>>('/bookings/owner/bookings', { params: { lotId, ...params } }),

  checkIn: (id: string) => api.put<ApiResponse<IBooking>>(`/bookings/${id}/check-in`),
  checkOut: (id: string) => api.put<ApiResponse<IBooking>>(`/bookings/${id}/check-out`),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<PaginatedResult<INotification>>>('/notifications', { params }),

  getUnreadCount: () =>
    api.get<ApiResponse<{ count: number }>>('/notifications/unread-count'),

  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsApi = {
  getOwnerStats: () => api.get<ApiResponse<unknown>>('/analytics/owner'),
  getAdminStats: () => api.get<ApiResponse<unknown>>('/analytics/admin'),
};
