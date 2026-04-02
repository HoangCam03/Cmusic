import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '@spotify/libs/middleware/validation.middleware';
import { registerSchema, loginSchema } from '../validators/auth.validator';

const router = Router();

// POST /auth/register → Đăng ký + gửi OTP
router.post('/register', validate(registerSchema), authController.register as any);

// POST /auth/login → Đăng nhập
router.post('/login', validate(loginSchema), authController.login as any);

// POST /auth/verify-email → Xác thực OTP (body-based)
router.post('/verify-email', authController.verifyEmail as any);

// POST /auth/resend-otp → Gửi lại OTP
router.post('/resend-otp', authController.resendOtp as any);

// POST /auth/refresh
router.post('/refresh', authController.refresh as any);

// POST /auth/logout
router.post('/logout', authController.logout as any);

export default router;
