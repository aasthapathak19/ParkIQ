import { Router } from 'express';
import { vehicleController } from './vehicle.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { AddVehicleSchema, UpdateVehicleSchema } from './vehicle.schema';

const router = Router();

router.use(authenticate);
router.use(authorize('customer'));

router.post('/', validate(AddVehicleSchema), vehicleController.addVehicle);
router.get('/', vehicleController.getMyVehicles);
router.put('/:id', validate(UpdateVehicleSchema), vehicleController.updateVehicle);
router.delete('/:id', vehicleController.deleteVehicle);
router.put('/:id/default', vehicleController.setDefault);

export default router;
