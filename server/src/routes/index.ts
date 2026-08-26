import { Router } from 'express';
import { env } from '../config/env';
import authRoutes from '../modules/auth/auth.routes';
import userRoutes from '../modules/users/user.routes';
import vehicleRoutes from '../modules/vehicles/vehicle.routes';
import parkingRoutes from '../modules/parking/parking.routes';
import slotRoutes from '../modules/slots/slot.routes';
import bookingRoutes from '../modules/bookings/booking.routes';
import notificationRoutes from '../modules/notifications/notification.routes';
import analyticsRoutes from '../modules/analytics/analytics.routes';
// Phase 3 — Verified Marketplace
import verificationRoutes from '../modules/verification/verification.routes';
import claimRoutes from '../modules/claims/claim.routes';
import reportRoutes from '../modules/reports/report.routes';

const router = Router();
const API_PREFIX = `/api/${env.API_VERSION}`;

router.use(`${API_PREFIX}/auth`, authRoutes);
router.use(`${API_PREFIX}/users`, userRoutes);
router.use(`${API_PREFIX}/vehicles`, vehicleRoutes);
router.use(`${API_PREFIX}/parking`, parkingRoutes);
router.use(`${API_PREFIX}/parking/:parkingId/slots`, slotRoutes);
router.use(`${API_PREFIX}/bookings`, bookingRoutes);
router.use(`${API_PREFIX}/notifications`, notificationRoutes);
router.use(`${API_PREFIX}/analytics`, analyticsRoutes);
// Phase 3
router.use(`${API_PREFIX}/verification`, verificationRoutes);
router.use(`${API_PREFIX}/claims`, claimRoutes);
router.use(`${API_PREFIX}/reports`, reportRoutes);

export default router;
