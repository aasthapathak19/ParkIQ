export const queryKeys = {
  // Auth
  me: ['me'] as const,

  // Vehicles
  vehicles: ['vehicles'] as const,
  vehicle: (id: string) => ['vehicles', id] as const,

  // Parking
  parkingLots: (params?: Record<string, unknown>) => ['parking', params] as const,
  parkingLot: (id: string) => ['parking', id] as const,
  nearbyParking: (lat: number, lng: number, radius?: number) =>
    ['parking', 'nearby', lat, lng, radius] as const,
  favourites: ['parking', 'favourites'] as const,
  myLots: ['parking', 'my-lots'] as const,

  // Slots
  slots: (lotId: string) => ['slots', lotId] as const,
  slot: (id: string) => ['slots', 'detail', id] as const,

  // Bookings
  bookings: (params?: Record<string, unknown>) => ['bookings', params] as const,
  booking: (id: string) => ['bookings', id] as const,
  ownerBookings: (lotId: string, params?: Record<string, unknown>) =>
    ['owner-bookings', lotId, params] as const,

  // Notifications
  notifications: (page?: number) => ['notifications', page] as const,
  unreadCount: ['notifications', 'unread'] as const,

  // Analytics
  ownerAnalytics: ['analytics', 'owner'] as const,
  adminAnalytics: ['analytics', 'admin'] as const,

  // Admin
  adminUsers: (params?: Record<string, unknown>) => ['admin', 'users', params] as const,
  adminParkingApprovals: (params?: Record<string, unknown>) =>
    ['admin', 'parking-approvals', params] as const,
} as const;
