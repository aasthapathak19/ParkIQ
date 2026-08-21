import { Router } from 'express';
import { slotController } from './slot.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';

const router = Router({ mergeParams: true }); // Inherit :parkingId from parent

// Public
router.get('/', slotController.getSlotsByLot);

// Owner only
router.post('/', authenticate, authorize('owner'), slotController.createSlots);
router.put('/:slotId', authenticate, authorize('owner'), slotController.updateSlot);
router.put('/:slotId/status', authenticate, authorize('owner'), slotController.updateStatus);
router.delete('/:slotId', authenticate, authorize('owner'), slotController.deleteSlot);

export default router;
