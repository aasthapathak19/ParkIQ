import { z } from 'zod';

export const AddVehicleSchema = z.object({
  licensePlate: z.string().min(4).max(15).toUpperCase().trim(),
  type: z.enum(['car', 'motorcycle', 'ev', 'truck', 'van']),
  brand: z.string().min(1).max(50).trim(),
  model: z.string().min(1).max(50).trim(),
  year: z.number().int().min(1990).max(new Date().getFullYear() + 1).optional(),
  color: z.string().max(30).optional(),
  isDefault: z.boolean().default(false),
  evDetails: z.object({
    batteryCapacity: z.number().positive().optional(),
    range: z.number().positive().optional(),
    connectorType: z.enum(['Type2', 'CCS', 'CHAdeMO', 'Tesla']).optional(),
  }).optional(),
});

export const UpdateVehicleSchema = AddVehicleSchema.partial().omit({ licensePlate: true });
