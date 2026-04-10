import { Router } from 'express';
import { getEgresos, createEgreso, getEgresoById, updateEgreso, deleteEgreso } from '../controllers/egreso.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getEgresos);
router.post('/', createEgreso);
router.get('/:id', getEgresoById);
router.patch('/:id', updateEgreso);
router.delete('/:id', deleteEgreso);

export default router;
