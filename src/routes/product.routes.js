import { Router } from 'express';
import { getProducts, createProduct, getProductById, updateProduct, deleteProduct } from '../controllers/product.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getProducts);
router.post('/', createProduct);
router.get('/:id', getProductById);
router.patch('/:id', updateProduct);
router.delete('/:id', adminMiddleware, deleteProduct);

export default router;
