/**
 * backend/src/routes/authRoutes.js
 * Express routing definitions for user authentication and authorization.
 */

import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { registerSchema, loginSchema, validateRequestBody } from '../validators/authValidator.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public routes
router.post('/register', validateRequestBody(registerSchema), authController.register);
router.post('/login', validateRequestBody(loginSchema), authController.login);

// Protected routes
router.get('/me', authenticate, authController.getMe);

export default router;
