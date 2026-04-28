import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
  getProveedores,
  createProveedor,
  getProveedorById,
  updateProveedor,
  deleteProveedor
} from '../controllers/proveedores.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getProveedores);
router.post('/', createProveedor);
router.get('/:id', getProveedorById);
router.patch('/:id', updateProveedor);
router.delete('/:id', deleteProveedor);

export default router;
