import { z } from 'zod';

const PeakHourSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startHour: z.number().int().min(0).max(23),
  endHour: z.number().int().min(1).max(24),
});

const OperatingHourSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  open: z.string().regex(/^\d{2}:\d{2}$/).default('00:00'),
  close: z.string().regex(/^\d{2}:\d{2}$/).default('23:59'),
  isClosed: z.boolean().default(false),
});

export const CreateParkingSchema = z.object({
  name: z.string().min(3).max(200).trim(),
  description: z.string().max(2000).optional(),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    country: z.string().default('India'),
    zipCode: z.string().optional(),
  }),
  location: z.object({
    coordinates: z.tuple([
      z.number().min(-180).max(180), // longitude
      z.number().min(-90).max(90),   // latitude
    ]),
  }),
  amenities: z.object({
    isEVCharging: z.boolean().default(false),
    isCovered: z.boolean().default(false),
    is24x7: z.boolean().default(false),
    hasSecurity: z.boolean().default(false),
    hasCCTV: z.boolean().default(false),
    hasWifi: z.boolean().default(false),
    hasDisabledAccess: z.boolean().default(false),
    hasCarWash: z.boolean().default(false),
    hasValet: z.boolean().default(false),
  }).optional(),
  pricing: z.object({
    baseRate: z.number().positive('Base rate must be positive'),
    currency: z.string().length(3).default('INR'),
    minimumDuration: z.number().int().min(15).default(60),
    maximumDuration: z.number().int().max(10080).default(1440),
    peakHourRate: z.number().min(0).default(0),
    peakHours: z.array(PeakHourSchema).default([]),
    weekendMultiplier: z.number().min(1).max(5).default(1),
    pricingStrategy: z.enum(['fixed', 'time_based', 'dynamic', 'ml_driven']).default('time_based'),
  }),
  operatingHours: z.array(OperatingHourSchema).optional(),
  totalFloors: z.number().int().min(1).max(20).default(1),
});

export const UpdateParkingSchema = CreateParkingSchema.partial();

export const SearchParkingSchema = z.object({
  city: z.string().optional(),
  lat: z.string().transform(Number).optional(),
  lng: z.string().transform(Number).optional(),
  radius: z.string().transform(Number).default('10'),
  maxPrice: z.string().transform(Number).optional(),
  minPrice: z.string().transform(Number).optional(),
  isEV: z.string().transform((v) => v === 'true').optional(),
  isCovered: z.string().transform((v) => v === 'true').optional(),
  is24x7: z.string().transform((v) => v === 'true').optional(),
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  sortBy: z.enum(['price', 'rating', 'distance', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
