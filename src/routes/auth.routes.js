import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, refresh, logout } from '../controllers/auth.controller.js';

const router = Router();

// Max 5 intentos por 15 minutos
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Demasiados intentos fallidos, reintente en 15 minutos.' }
});

router.post('/login', loginLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', logout);

export default router;
