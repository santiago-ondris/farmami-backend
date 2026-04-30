import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
  getEvaluacionesProveedor,
  createEvaluacionProveedor,
  getEvaluacionProveedorById,
  updateEvaluacionProveedor,
  deleteEvaluacionProveedor
} from '../controllers/proveedores/evaluaciones-proveedores.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/proveedores/:id/evaluaciones', getEvaluacionesProveedor);
router.post('/proveedores/:id/evaluaciones', createEvaluacionProveedor);
router.get('/evaluaciones-proveedores/:id', getEvaluacionProveedorById);
router.patch('/evaluaciones-proveedores/:id', updateEvaluacionProveedor);
router.delete('/evaluaciones-proveedores/:id', deleteEvaluacionProveedor);

export default router;
