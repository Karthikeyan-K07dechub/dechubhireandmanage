import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { listInvoices, approveInvoice, disputeInvoice } from '../controllers/invoices.controller';

const router = Router();
router.use(requireAuth);
router.get('/', listInvoices);
router.post('/:id/approve', approveInvoice);
router.post('/:id/dispute', disputeInvoice);
export default router;
