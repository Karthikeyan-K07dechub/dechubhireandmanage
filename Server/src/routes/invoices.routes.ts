import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { downloadCompanyInvoice, listInvoices, approveInvoice, disputeInvoice } from '../controllers/invoices.controller';

const router = Router();
router.use(requireAuth);
router.get('/', listInvoices);
router.get('/:id/pdf', downloadCompanyInvoice);
router.post('/:id/approve', approveInvoice);
router.post('/:id/dispute', disputeInvoice);
export default router;
