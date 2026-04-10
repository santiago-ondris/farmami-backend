import { Router } from 'express';
import { getIngresos, createIngreso, getIngresoById, updateIngreso, deleteIngreso } from '../controllers/ingreso.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getIngresos);
router.post('/', createIngreso);
router.get('/:id', getIngresoById);
router.patch('/:id', updateIngreso);
router.delete('/:id', deleteIngreso);

export default router;
