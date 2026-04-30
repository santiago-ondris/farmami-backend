import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
  getEvaluacionesCliente,
  createEvaluacionCliente,
  getEvaluacionClienteById,
  updateEvaluacionCliente,
  deleteEvaluacionCliente
} from '../controllers/clientes/evaluaciones-clientes.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/clientes/:id/evaluaciones', getEvaluacionesCliente);
router.post('/clientes/:id/evaluaciones', createEvaluacionCliente);
router.get('/evaluaciones-clientes/:id', getEvaluacionClienteById);
router.patch('/evaluaciones-clientes/:id', updateEvaluacionCliente);
router.delete('/evaluaciones-clientes/:id', deleteEvaluacionCliente);

export default router;
