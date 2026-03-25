import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { validate } from '@libs/middleware/validation.middleware.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';

const router = Router();

// /auth/register
router.post('/register', validate(registerSchema), authController.register as any);

// /auth/login
router.post('/login', validate(loginSchema), authController.login as any);

// /auth/refresh
router.post('/refresh', authController.refresh as any);

// /auth/logout
router.post('/logout', authController.logout as any);

export default router;
