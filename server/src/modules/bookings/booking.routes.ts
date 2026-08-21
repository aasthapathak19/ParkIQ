import { Router } from 'express';
import { bookingController } from './booking.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate);

// Customer routes
router.post('/', authorize('customer'), bookingController.createBooking);
router.get('/', authorize('customer'), bookingController.getMyBookings);
router.get('/:id', authorize('customer'), bookingController.getBookingById);
router.put('/:id/cancel', authorize('customer'), bookingController.cancelBooking);
router.get('/:id/qr', authorize('customer'), bookingController.getQRCode);
router.post('/price-estimate', authorize('customer'), bookingController.getPriceEstimate);

// Owner routes
router.get('/owner/bookings', authorize('owner'), bookingController.getOwnerBookings);
router.put('/:id/check-in', authorize('owner'), bookingController.checkIn);
router.put('/:id/check-out', authorize('owner'), bookingController.checkOut);

export default router;
