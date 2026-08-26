// â”€â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Vehicle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Parking â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    verificationStatus?: VerificationStatus;
  verificationLevel?: VerificationLevel;
  isDuplicateFlagged?: boolean;
rating?: {
    average: number;
    count: number;
  };
  distance?: number;
  createdAt: string;
}

// â”€â”€â”€ Slot â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Booking â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Notification â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Pagination â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Search â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// "?"?"? Phase 3 - Verification "?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?
export type VerificationStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'MORE_INFO_REQUIRED' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
export type VerificationType = 'PROPERTY_OWNER' | 'LEASE_HOLDER' | 'AUTHORIZED_OPERATOR' | 'BUSINESS_OPERATOR' | 'PROPERTY_MANAGER' | 'OTHER';
export type VerificationLevel = 'PARKIQ_VERIFIED' | 'VERIFIED_OWNER' | 'VERIFIED_OPERATOR' | 'LOCATION_VERIFIED' | 'BASIC_VERIFIED';

export interface IDuplicateWarning {
  lotId: string;
  distanceMeters: number;
  flaggedAt: string;
}

export interface IParkingVerification {
  _id: string;
  parkingId: string | IParkingLot;
  ownerId: string | IUser;
  verificationType: VerificationType;
  status: VerificationStatus;
  verificationLevel?: VerificationLevel;
  evidenceRefs?: Array<{
    evidenceType: string;
    description: string;
    fileKey: string;
    mimeType: string;
    uploadedAt: string;
  }>;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string | IUser;
  reviewReason?: string;
  adminNotes?: string;
  duplicateWarnings: IDuplicateWarning[];
  previousAttempts: number;
  createdAt: string;
  updatedAt: string;
}

// "?"?"? Phase 3 - Claims "?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?
export type ClaimStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export interface IClaimRequest {
  _id: string;
  parkingId: string | IParkingLot;
  claimantId: string | IUser;
  status: ClaimStatus;
  claimReason: string;
  evidenceRefs?: Array<any>;
  reviewedBy?: string | IUser;
  reviewReason?: string;
  conflictsWith?: string | IUser;
  createdAt: string;
  updatedAt: string;
}

// "?"?"? Phase 3 - Reports "?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?
export type ReportReason = 'DOESNT_EXIST' | 'WRONG_LOCATION' | 'FAKE_LISTING' | 'UNAUTHORIZED' | 'WRONG_AVAILABILITY' | 'FRAUD_PAYMENT' | 'SAFETY_CONCERN' | 'OTHER';
export type ReportStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';

export interface IParkingReport {
  _id: string;
  parkingId: string | IParkingLot;
  reportedBy: string | IUser;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  resolution?: string;
  resolvedBy?: string | IUser;
  createdAt: string;
  updatedAt: string;
}

// "?"?"? Phase 3 - Audit "?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?
export interface IAuditLog {
  _id: string;
  actorId: string | IUser;
  action: string;
  entityType: string;
  entityId: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

