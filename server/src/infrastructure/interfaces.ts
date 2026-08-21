// ─── Cache Interface ──────────────────────────────────────────────────────────
// Phase 1: InMemoryCache
// Phase 2: RedisCache (swap in container.ts — zero service changes)
export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  invalidatePattern(pattern: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

// ─── Queue Interface ──────────────────────────────────────────────────────────
export interface JobOptions {
  delay?: number;
  attempts?: number;
}

export interface IQueueService {
  enqueue<T>(jobName: string, data: T, options?: JobOptions): Promise<string>;
  schedule<T>(jobName: string, data: T, runAt: Date): Promise<string>;
  cancel(jobId: string): Promise<void>;
}

// ─── Storage Interface ────────────────────────────────────────────────────────
export interface IStorageService {
  upload(file: Buffer, path: string, contentType: string): Promise<string>;
  delete(path: string): Promise<void>;
  getSignedUrl(path: string, expiresInSeconds: number): Promise<string>;
}

// ─── Pricing Interface (Strategy Pattern) ────────────────────────────────────
export interface PricingContext {
  baseRate: number;
  currency: string;
  durationMinutes: number;
  startTime: Date;
  peakHours?: Array<{ dayOfWeek: number; startHour: number; endHour: number }>;
  peakHourRate?: number;
  weekendMultiplier?: number;
  strategy?: string;
}

export interface PriceBreakdown {
  base: number;
  peakSurcharge: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  durationMinutes: number;
  strategy: string;
  rawBreakdown: Record<string, number>;
}

export interface IPricingEngine {
  calculatePrice(context: PricingContext): Promise<PriceBreakdown>;
  estimatePrice(context: PricingContext): Promise<PriceBreakdown>;
}

// ─── Payment Interface (Strategy Pattern) ────────────────────────────────────
export interface PaymentMetadata {
  bookingRef: string;
  customerId: string;
  description: string;
}

export interface PaymentIntent {
  id: string;
  status: string;
  clientSecret?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  paidAt: Date;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  refundedAt: Date;
  amount: number;
}

export interface IPaymentGateway {
  createPaymentIntent(amount: number, currency: string, metadata: PaymentMetadata): Promise<PaymentIntent>;
  confirmPayment(intentId: string): Promise<PaymentResult>;
  refund(intentId: string, amount?: number): Promise<RefundResult>;
}

// ─── Notification Channel Interface (Strategy Pattern) ───────────────────────
export interface NotificationPayload {
  recipientId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface DeliveryReceipt {
  channel: string;
  status: 'sent' | 'failed';
  sentAt: Date;
  error?: string;
}

export interface INotificationChannel {
  send(payload: NotificationPayload): Promise<DeliveryReceipt>;
  supportsType(_notificationType: string): boolean;
  channelName: string;
}

// ─── Vision Service Interface (Adapter Pattern) ───────────────────────────────
export interface OccupancyDetection {
  isOccupied: boolean;
  confidence: number;
  detectedAt: Date;
}

export interface PlateDetection {
  plate: string | null;
  confidence: number;
  detectedAt: Date;
}

export interface IVisionService {
  detectOccupancy(imageUrl: string, slotId: string): Promise<OccupancyDetection>;
  detectLicensePlate(imageUrl: string): Promise<PlateDetection>;
}

// ─── OCR Service Interface (Adapter Pattern) ──────────────────────────────────
export interface PlateExtractionResult {
  plate: string | null;
  confidence: number;
  rawText: string;
}

export interface IOCRService {
  extractPlate(imageBuffer: Buffer): Promise<PlateExtractionResult>;
}

// ─── Analytics Interface ──────────────────────────────────────────────────────
export interface AnalyticsEvent {
  type: string;
  userId?: string;
  resourceId?: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface OccupancyStats {
  average: number;
  peak: number;
  byHour: Record<number, number>;
}

export interface RevenueStats {
  total: number;
  byDay: Array<{ date: string; revenue: number }>;
  currency: string;
}

export interface IAnalyticsService {
  recordEvent(event: AnalyticsEvent): Promise<void>;
  queryOccupancy(lotId: string, period: DateRange): Promise<OccupancyStats>;
  queryRevenue(ownerId: string, period: DateRange): Promise<RevenueStats>;
}
