import { Router } from 'express';
import { createUser, getUsers, deleteUser } from '../controllers/user.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';

const router = Router();

router.get('/', authMiddleware, adminMiddleware, getUsers);
router.post('/', authMiddleware, adminMiddleware, createUser);
router.delete('/:id', authMiddleware, adminMiddleware, deleteUser);

export default router;
