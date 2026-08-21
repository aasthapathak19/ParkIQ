import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { UpdateProfileSchema } from './user.schema';

const router = Router();

router.use(authenticate);

// Self-management (all roles)
router.get('/me', userController.getMe);
router.put('/me', validate(UpdateProfileSchema), userController.updateMe);
router.delete('/me', userController.deleteMe);

// Admin only
router.get('/', authorize('admin'), userController.getAllUsers);
router.put('/:id/status', authorize('admin'), userController.updateUserStatus);

export default router;
