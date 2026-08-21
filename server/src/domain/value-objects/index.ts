/**
 * Money value object — prevents raw number arithmetic bugs across currency.
 * All monetary amounts in the system are represented as integers (minor units)
 * or as { amount: number, currency: string } objects.
 */
export class Money {
  public readonly amount: number;
  public readonly currency: string;

  constructor(amount: number, currency: string) {
    if (amount < 0) throw new Error('Money amount cannot be negative');
    if (!currency || currency.length !== 3) throw new Error('Currency must be a valid ISO-4217 code');
    this.amount = Math.round(amount * 100) / 100; // 2dp precision
    this.currency = currency.toUpperCase();
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }

  toJSON(): { amount: number; currency: string } {
    return { amount: this.amount, currency: this.currency };
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(`Currency mismatch: ${this.currency} vs ${other.currency}`);
    }
  }
}

/**
 * TimeSlot value object — encapsulates a time range with overlap detection.
 */
export class TimeSlot {
  public readonly startTime: Date;
  public readonly endTime: Date;
  public readonly durationMinutes: number;

  constructor(startTime: Date, endTime: Date) {
    if (endTime <= startTime) throw new Error('End time must be after start time');
    this.startTime = startTime;
    this.endTime = endTime;
    this.durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
  }

  overlaps(other: TimeSlot): boolean {
    return this.startTime < other.endTime && this.endTime > other.startTime;
  }

  contains(time: Date): boolean {
    return time >= this.startTime && time <= this.endTime;
  }
}

/**
 * GeoCoordinate value object — validates coordinates and computes distance.
 */
export class GeoCoordinate {
  public readonly latitude: number;
  public readonly longitude: number;

  constructor(latitude: number, longitude: number) {
    if (latitude < -90 || latitude > 90) throw new Error('Invalid latitude');
    if (longitude < -180 || longitude > 180) throw new Error('Invalid longitude');
    this.latitude = latitude;
    this.longitude = longitude;
  }

  /** Haversine distance in kilometers */
  distanceTo(other: GeoCoordinate): number {
    const R = 6371;
    const dLat = this.toRad(other.latitude - this.latitude);
    const dLon = this.toRad(other.longitude - this.longitude);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(this.latitude)) *
        Math.cos(this.toRad(other.latitude)) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  toGeoJSON(): { type: 'Point'; coordinates: [number, number] } {
    return { type: 'Point', coordinates: [this.longitude, this.latitude] };
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }
}

/**
 * BookingReference value object — generates and validates booking IDs.
 */
export class BookingReference {
  private static readonly PREFIX = 'PKQ';

  static generate(): string {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${BookingReference.PREFIX}-${year}-${random}`;
  }

  static isValid(ref: string): boolean {
    return /^PKQ-\d{4}-[A-Z0-9]{6}$/.test(ref);
  }
}
