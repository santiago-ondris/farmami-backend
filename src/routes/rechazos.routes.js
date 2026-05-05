import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
  getRechazos,
  createRechazo,
  getRechazoById,
  updateRechazo,
  deleteRechazo,
  getRechazoPdf
} from '../controllers/rechazos/rechazos.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getRechazos);
router.post('/', createRechazo);
router.get('/:id', getRechazoById);
router.get('/:id/pdf', getRechazoPdf);
router.patch('/:id', updateRechazo);
router.delete('/:id', deleteRechazo);

export default router;
