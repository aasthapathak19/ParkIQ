import api from '@/lib/axios';
import {
  AuthResponse, IUser, IVehicle, IParkingLot, ISlot,
  IBooking, INotification, PaginatedResult, ApiResponse, SearchParams,
  IParkingVerification, IClaimRequest, IParkingReport, IAuditLog } from '@/types';

// â”€â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Users â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Vehicles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Parking â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Slots â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Bookings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Notifications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const notificationsApi = {
  getAll: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<PaginatedResult<INotification>>>('/notifications', { params }),

  getUnreadCount: () =>
    api.get<ApiResponse<{ count: number }>>('/notifications/unread-count'),

  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

// â”€â”€â”€ Analytics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const analyticsApi = {
  getOwnerStats: () => api.get<ApiResponse<unknown>>('/analytics/owner'),
  getAdminStats: () => api.get<ApiResponse<unknown>>('/analytics/admin'),
};

// "?"?"? Phase 3 - Verification "?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?
export const verificationApi = {
  // Owner
  getMyVerifications: () => api.get<ApiResponse<IParkingVerification[]>>('/verification/my'),
  getVerificationStatus: (parkingId: string) => api.get<ApiResponse<IParkingVerification>>(`/verification/parking/${parkingId}`),
  updateVerificationType: (parkingId: string, verificationType: string) => api.put<ApiResponse<IParkingVerification>>(`/verification/parking/${parkingId}/type`, { verificationType }),
  submitVerification: (parkingId: string) => api.post<ApiResponse<IParkingVerification>>(`/verification/parking/${parkingId}/submit`),
  addEvidence: (parkingId: string, data: { evidenceType: string; description?: string; fileKey: string; mimeType: string }) => api.post<ApiResponse<IParkingVerification>>(`/verification/parking/${parkingId}/evidence`, data),
  
  // Admin
  adminListAll: (params?: Record<string, any>) => api.get<ApiResponse<PaginatedResult<IParkingVerification>>>('/verification/admin', { params }),
  adminGetDetail: (id: string) => api.get<ApiResponse<IParkingVerification>>(`/verification/admin/${id}`),
  adminApprove: (id: string, data: { verificationLevel?: string; reason?: string; adminNotes?: string }) => api.post<ApiResponse<IParkingVerification>>(`/verification/admin/${id}/approve`, data),
  adminReject: (id: string, data: { reason: string; adminNotes?: string }) => api.post<ApiResponse<IParkingVerification>>(`/verification/admin/${id}/reject`, data),
  adminRequestInfo: (id: string, data: { reason: string; adminNotes?: string }) => api.post<ApiResponse<IParkingVerification>>(`/verification/admin/${id}/request-info`, data),
  adminSuspendParking: (parkingId: string, data: { reason: string }) => api.post<ApiResponse<null>>(`/verification/admin/parking/${parkingId}/suspend`, data),
  adminReinstateParking: (parkingId: string, data: { reason: string }) => api.post<ApiResponse<null>>(`/verification/admin/parking/${parkingId}/reinstate`, data),
  adminGetEvidenceUrl: (fileKey: string) => api.get<ApiResponse<{ url: string }>>(`/verification/admin/evidence/${fileKey}`),
  adminGetAudit: (params?: Record<string, any>) => api.get<ApiResponse<PaginatedResult<IAuditLog>>>('/verification/admin/audit', { params }),
};

// "?"?"? Phase 3 - Claims "?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?
export const claimsApi = {
  createClaim: (parkingId: string, claimReason: string) => api.post<ApiResponse<IClaimRequest>>(`/claims/parking/${parkingId}`, { claimReason }),
  getMyClaims: () => api.get<ApiResponse<IClaimRequest[]>>('/claims/my'),
  adminListAll: (params?: Record<string, any>) => api.get<ApiResponse<PaginatedResult<IClaimRequest>>>('/claims/admin', { params }),
  adminApprove: (id: string, reason: string) => api.post<ApiResponse<null>>(`/claims/admin/${id}/approve`, { reason }),
  adminReject: (id: string, reason: string) => api.post<ApiResponse<null>>(`/claims/admin/${id}/reject`, { reason }),
};

// "?"?"? Phase 3 - Reports "?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?
export const reportsApi = {
  createReport: (parkingId: string, data: { reason: string; description?: string }) => api.post<ApiResponse<IParkingReport>>(`/reports/parking/${parkingId}`, data),
  adminListAll: (params?: Record<string, any>) => api.get<ApiResponse<PaginatedResult<IParkingReport>>>('/reports/admin', { params }),
  adminResolve: (id: string, resolution: string) => api.post<ApiResponse<null>>(`/reports/admin/${id}/resolve`, { resolution }),
  adminDismiss: (id: string, resolution: string) => api.post<ApiResponse<null>>(`/reports/admin/${id}/dismiss`, { resolution }),
};

