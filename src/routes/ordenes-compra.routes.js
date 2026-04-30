import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
  getOrdenesCompra,
  createOrdenCompra,
  getOrdenCompraById,
  updateOrdenCompra,
  deleteOrdenCompra,
  getOrdenCompraPdf
} from '../controllers/ordenes-compra/ordenes-compra.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getOrdenesCompra);
router.post('/', createOrdenCompra);
router.get('/:id', getOrdenCompraById);
router.patch('/:id', updateOrdenCompra);
router.delete('/:id', deleteOrdenCompra);
router.get('/:id/pdf', getOrdenCompraPdf);

export default router;
