import { AppError } from '../utils/response';
import multer from 'multer';
import { listAdminInvoices, downloadAdminInvoice, sendInvoiceToClient, retryInvoiceEmail } from '../controllers/adminInvoices.controller';
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireDechubAdmin } from '../middleware/admin.middleware';
import {
  login,
  refresh,
  listTalentRequests,
  getTalentRequest,
  updateTalentRequestStatus,
  unreadCount,
  markAsRead,
  sendTalentRequestShortlist,
  listMarketplaceCandidatesForAdmin,
} from '../controllers/admin.controller';
import { updateProjectPaymentStatus, createProject, listAdminProjects, sendProjectContract, verifyProjectPayment } from '../controllers/projects.controller';

const router = Router();

router.post('/login', login);
router.post('/refresh', refresh);

router.use(requireAuth, requireDechubAdmin);
router.get('/invoices', listAdminInvoices);
router.get('/invoices/:id/pdf', downloadAdminInvoice);
const invoiceUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 2 } }).single('invoice');
router.post('/invoices/:id/send-to-client', (req, res, next) => invoiceUpload(req, res, error => next(error ? new AppError('Choose one PDF file up to 10 MB.', 422, 'INVALID_INVOICE_UPLOAD') : undefined)), sendInvoiceToClient);
router.post('/invoices/:id/retry-email', retryInvoiceEmail);

router.get('/talent-requests', listTalentRequests);
router.get('/marketplace-candidates', listMarketplaceCandidatesForAdmin);
router.get('/projects', listAdminProjects);
router.post('/projects', createProject);
router.post('/projects/:id/send-contract', sendProjectContract);
router.post('/projects/:id/verify-payment', verifyProjectPayment);
router.patch('/projects/:id/payment-status', updateProjectPaymentStatus);
router.get('/talent-requests/unread-count', unreadCount);
router.get('/talent-requests/:id', getTalentRequest);
router.post('/talent-requests/:id/mark-as-read', markAsRead);
router.patch('/talent-requests/:id/status', updateTalentRequestStatus);
router.post('/talent-requests/:id/send-shortlist', sendTalentRequestShortlist);

export default router;
