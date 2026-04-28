import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
  getRemitos,
  createRemito,
  getRemitoById,
  updateRemito,
  deleteRemito,
  getRemitoPdf
} from '../controllers/remitos.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getRemitos);
router.post('/', createRemito);
router.get('/:id', getRemitoById);
router.patch('/:id', updateRemito);
router.delete('/:id', deleteRemito);
router.get('/:id/pdf', getRemitoPdf);

export default router;
