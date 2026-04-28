import { Router } from 'express';
import {
  getClientes,
  createCliente,
  getClienteById,
  updateCliente,
  deleteCliente
} from '../controllers/clientes.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getClientes);
router.post('/', createCliente);
router.get('/:id', getClienteById);
router.patch('/:id', updateCliente);
router.delete('/:id', deleteCliente);

export default router;
