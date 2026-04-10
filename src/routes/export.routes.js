import { Router } from 'express';
import { exportIngresos, exportEgresos } from '../controllers/export.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/ingresos', exportIngresos);
router.get('/egresos', exportEgresos);

export default router;
