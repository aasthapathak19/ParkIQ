// ─── Auth ───────────────────────────────────────────────────────────────────
export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'owner' | 'admin';
  phone?: string;
  avatar?: string;
  isActive: boolean;
  isSuspended: boolean;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: IUser;
  tokens: AuthTokens;
}

// ─── Vehicle ─────────────────────────────────────────────────────────────────
export interface IVehicle {
  _id: string;
  owner: string;
  licensePlate: string;
  type: 'car' | 'motorcycle' | 'ev' | 'truck' | 'van';
  brand: string;
  model: string;
  year?: number;
  color?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

// ─── Parking ─────────────────────────────────────────────────────────────────
export interface IParkingLot {
  _id: string;
  owner: string;
  name: string;
  description?: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    formattedAddress: string;
  };
  location: {
    coordinates: [number, number];
  };
  capacity: {
    total: number;
    available: number;
  };
  pricing: {
    baseRate: number;
    currency: string;
    billingUnit: string;
  };
  amenities: string[];
  images: string[];
  status: 'pending' | 'active' | 'inactive' | 'suspended';
  rating?: {
    average: number;
    count: number;
  };
  distance?: number;
  createdAt: string;
}

// ─── Slot ─────────────────────────────────────────────────────────────────────
export interface ISlot {
  _id: string;
  parkingLot: string;
  slotNumber: string;
  floor: number;
  type: 'standard' | 'ev' | 'handicapped' | 'motorcycle' | 'truck' | 'vip' | 'covered' | 'uncovered';
  status: 'available' | 'occupied' | 'reserved' | 'maintenance' | 'inactive';
  displayLabel: string;
  createdAt: string;
}

// ─── Booking ─────────────────────────────────────────────────────────────────
export interface IBooking {
  _id: string;
  bookingRef: string;
  customer: string;
  vehicle: {
    vehicleId: string;
    licensePlate: string;
    type: string;
    brand: string;
    model: string;
  };
  parkingLot: {
    lotId: string;
    name: string;
    address: string;
  };
  slot: {
    slotId: string;
    slotNumber: string;
    floor: number;
    type: string;
  };
  startTime: string;
  endTime: string;
  duration: {
    planned: number;
    actual?: number;
  };
  amount: {
    base: number;
    peakSurcharge: number;
    tax: number;
    discount: number;
    total: number;
    currency: string;
  };
  payment: {
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    method?: string;
    paidAt?: string;
    refundedAt?: string;
  };
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'expired';
  qrCode?: string;
  actualCheckIn?: string;
  actualCheckOut?: string;
  createdAt: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────
export interface INotification {
  _id: string;
  type: string;
  title: string;
  body: string;
  data?: {
    resourceType?: string;
    resourceId?: string;
    actionUrl?: string;
  };
  isRead: boolean;
  readAt?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  requestId?: string;
}

// ─── Search ───────────────────────────────────────────────────────────────────
export interface SearchParams {
  lat?: number;
  lng?: number;
  radius?: number;
  search?: string;
  vehicleType?: string;
  maxPrice?: number;
  page?: number;
  limit?: number;
}
