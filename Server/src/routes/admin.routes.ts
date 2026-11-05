import { reviewContractorInvoice } from '../controllers/adminInvoices.controller';
import { downloadPaymentProof, paymentProofInfo } from '../controllers/paymentProof.controller';
import { listProjectKyc, downloadWorkerKyc } from '../controllers/adminVerification.controller';
import { adminDocumentFile, adminProjectDocuments, uploadProjectDocument, reviewProjectDocument } from '../controllers/documents.controller';
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
router.post('/invoices/:id/review',reviewContractorInvoice);
const invoiceUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 2 } }).single('invoice');
router.post('/invoices/:id/send-to-client', (req, res, next) => invoiceUpload(req, res, error => next(error ? new AppError('Choose one PDF file up to 10 MB.', 422, 'INVALID_INVOICE_UPLOAD') : undefined)), sendInvoiceToClient);
router.post('/invoices/:id/retry-email', retryInvoiceEmail);
router.get('/projects/:id/documents', adminProjectDocuments);
router.get('/projects/:id/documents/:key/file', adminDocumentFile);
const projectDocumentUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 0 } }).single('document');
router.post('/projects/:id/documents', (req, res, next) => projectDocumentUpload(req, res, error => next(error ? new AppError('Choose one PDF up to 10 MB.', 422, 'INVALID_DOCUMENT') : undefined)), uploadProjectDocument);
router.patch('/projects/:id/documents/review', reviewProjectDocument);

router.get('/talent-requests', listTalentRequests);
router.get('/marketplace-candidates', listMarketplaceCandidatesForAdmin);
router.get('/projects', listAdminProjects);
router.get('/projects/:id/kyc', listProjectKyc);
router.get('/workers/:id/kyc/:field/file', downloadWorkerKyc);
router.post('/projects', createProject);
router.post('/projects/:id/send-contract', sendProjectContract);
router.get('/projects/:id/payment-proof/info', paymentProofInfo);
router.get('/projects/:id/payment-proof', downloadPaymentProof);
router.post('/projects/:id/verify-payment', verifyProjectPayment);
router.patch('/projects/:id/payment-status', updateProjectPaymentStatus);
router.get('/talent-requests/unread-count', unreadCount);
router.get('/talent-requests/:id', getTalentRequest);
router.post('/talent-requests/:id/mark-as-read', markAsRead);
router.patch('/talent-requests/:id/status', updateTalentRequestStatus);
router.post('/talent-requests/:id/send-shortlist', sendTalentRequestShortlist);

export default router;
