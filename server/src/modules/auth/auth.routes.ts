import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  RegisterSchema, LoginSchema, RefreshTokenSchema,
  ForgotPasswordSchema, ResetPasswordSchema,
} from '../users/user.schema';

const router = Router();

router.post('/register', validate(RegisterSchema), authController.register);
router.post('/login', validate(LoginSchema), authController.login);
router.post('/logout', authenticate, validate(RefreshTokenSchema), authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.post('/refresh-token', validate(RefreshTokenSchema), authController.refreshToken);
router.post('/forgot-password', validate(ForgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(ResetPasswordSchema), authController.resetPassword);

export default router;
