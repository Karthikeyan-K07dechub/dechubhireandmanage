import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { countersignContract, listContracts, exportContracts } from '../controllers/contracts.controller';

const router = Router();

router.use(requireAuth);
router.get('/', listContracts);
router.get('/export', exportContracts);
router.post('/:id/countersign', countersignContract);

export default router;
