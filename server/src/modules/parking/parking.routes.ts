import { Router } from 'express';
import { parkingController } from './parking.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { CreateParkingSchema, UpdateParkingSchema, SearchParkingSchema } from './parking.schema';

const router = Router();

// Public routes
router.get('/', validate(SearchParkingSchema, 'query'), parkingController.search);
router.get('/slug/:slug', parkingController.getLotBySlug);
router.get('/:id', parkingController.getLotById);

// Owner routes
router.post('/', authenticate, authorize('owner'), validate(CreateParkingSchema), parkingController.createLot);
router.get('/owner/my-lots', authenticate, authorize('owner'), parkingController.getMyLots);
router.put('/:id', authenticate, authorize('owner'), validate(UpdateParkingSchema), parkingController.updateLot);
router.delete('/:id', authenticate, authorize('owner'), parkingController.deleteLot);

// Admin routes
router.get('/admin/pending', authenticate, authorize('admin'), parkingController.getPendingApprovals);
router.put('/:id/status', authenticate, authorize('admin'), parkingController.updateStatus);

// Customer routes
router.post('/:id/favourite', authenticate, authorize('customer'), parkingController.toggleFavourite);

export default router;
