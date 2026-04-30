import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
  getRechazos,
  createRechazo,
  getRechazoById,
  updateRechazo,
  deleteRechazo
} from '../controllers/rechazos/rechazos.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getRechazos);
router.post('/', createRechazo);
router.get('/:id', getRechazoById);
router.patch('/:id', updateRechazo);
router.delete('/:id', deleteRechazo);

export default router;
