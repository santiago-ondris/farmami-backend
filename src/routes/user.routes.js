import { Router } from 'express';
import { createUser } from '../controllers/user.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';

const router = Router();

router.post('/', authMiddleware, adminMiddleware, createUser);

export default router;
