import { Router } from 'express';
import { getGlobalStock, getProductStock } from '../controllers/stock.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getGlobalStock);
router.get('/:productId', getProductStock);

export default router;
