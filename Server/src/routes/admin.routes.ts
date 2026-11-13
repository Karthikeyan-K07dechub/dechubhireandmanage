import {adminUpdateAttention,readAdminUpdateAttention} from '../controllers/dashboardUpdateAttention.controller';
import {adminWorkUpdates,reviewAdminWorkUpdate,reviewWorkUpdateFile,workUpdateProjects,readWorkUpdates} from '../controllers/workUpdateReview.controller';
import {createAdminProjectTask} from '../controllers/projects.controller';
import {getRequestTalentContract,sendRequestTalentContract} from '../controllers/requestTalentContract.controller';
import {getTalentProjectContract,sendTalentProjectContract} from '../controllers/talentProjectContract.controller';
import {listMonthlyInvoices,saveMonthlyInvoice,remindMonthlyInvoice,markMonthlyInvoicePaid,downloadMonthlyAdmin} from '../controllers/monthlyInvoices.controller';
import {equipmentDeliveryFile,readEquipmentDelivery,updateEquipmentDelivery,confirmEquipmentDelivery} from '../controllers/equipmentDelivery.controller';
import {listAdminEquipment,retryEquipmentEmail,readAdminEquipment} from '../controllers/equipmentRequests.controller';
import {sendContractorPaymentProof,downloadContractorPaymentProof} from '../controllers/contractorPaymentProof.controller';
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
router.get('/update-attention',adminUpdateAttention);
router.post('/update-attention/read',readAdminUpdateAttention);
router.get('/equipment-requests',listAdminEquipment);
router.get('/equipment-requests/:id/delivery-file',equipmentDeliveryFile('admin'));
const equipmentDeliveryUpload=multer({storage:multer.memoryStorage(),limits:{fileSize:2*1024*1024,files:1,fields:3}}).single('file');
router.post('/equipment-requests/:id/delivery',(req,res,next)=>equipmentDeliveryUpload(req,res,error=>next(error?new AppError('Choose a PDF or image up to 2 MB.',422,'INVALID_DELIVERY_FILE'):undefined)),updateEquipmentDelivery);
router.post('/equipment-requests/:id/read',readAdminEquipment);
router.post('/equipment-requests/:id/retry-email',retryEquipmentEmail);
const monthlyInvoiceUpload=multer({storage:multer.memoryStorage(),limits:{fileSize:10*1024*1024,files:1,fields:1}}).single('invoice');
const monthlyUpload=(req:import('express').Request,res:import('express').Response,next:import('express').NextFunction)=>monthlyInvoiceUpload(req,res,error=>next(error?new AppError('Choose one invoice PDF or image up to 10 MB.',422,'INVALID_INVOICE_UPLOAD'):undefined));
router.get('/monthly-invoices',listMonthlyInvoices);
router.post('/monthly-invoices',monthlyUpload,saveMonthlyInvoice);
router.post('/monthly-invoices/:id',monthlyUpload,saveMonthlyInvoice);
router.post('/monthly-invoices/:id/remind',remindMonthlyInvoice);
router.post('/monthly-invoices/:id/paid',markMonthlyInvoicePaid);
router.get('/monthly-invoices/:id/pdf',downloadMonthlyAdmin);
router.get('/invoices', listAdminInvoices);
router.get('/invoices/:id/pdf', downloadAdminInvoice);
const payoutProofUpload=multer({storage:multer.memoryStorage(),limits:{fileSize:2*1024*1024,files:1,fields:0}}).single('proof');
router.post('/invoices/:id/contractor-payment-proof',(req,res,next)=>payoutProofUpload(req,res,error=>next(error?new AppError('Choose a PDF or image up to 2 MB.',422,'INVALID_PROOF'):undefined)),sendContractorPaymentProof);
router.get('/invoices/:id/contractor-payment-proof',downloadContractorPaymentProof);
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
router.get('/work-updates/projects',workUpdateProjects(true));
router.get('/projects/:id/work-updates',adminWorkUpdates);
router.post('/projects/:id/work-updates/read',readWorkUpdates(true));
router.post('/work-updates/:id/review',reviewAdminWorkUpdate);
router.get('/work-updates/:id/files/:fileId',reviewWorkUpdateFile(true));
const adminTaskUpload=multer({storage:multer.memoryStorage(),limits:{fileSize:10*1024*1024,files:1,fields:1}}).single('attachment');
router.post('/projects/:id/tasks',(req,res,next)=>adminTaskUpload(req,res,e=>next(e?new AppError('Choose one file up to 10 MB.',422,'INVALID_TASK_FILE'):undefined)),createAdminProjectTask);
router.get('/projects/:id/kyc', listProjectKyc);
router.get('/workers/:id/kyc/:field/file', downloadWorkerKyc);
router.post('/projects', createProject);
router.post('/projects/:id/send-contract', sendProjectContract);
router.get('/talent-requests/:requestId/talent-contract/:workerId',getRequestTalentContract);
router.post('/talent-requests/:requestId/talent-contract/:workerId',sendRequestTalentContract);
router.get('/projects/:id/talent-contract/:workerId',getTalentProjectContract);
router.post('/projects/:id/talent-contract/:workerId',sendTalentProjectContract);
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
