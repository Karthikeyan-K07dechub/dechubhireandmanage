import { listTeamMessages, sendTeamMessage, downloadTeamAttachment } from '../controllers/projectTeamMessages.controller';
import { listTaskMessages, postTaskMessage, taskAttachment, downloadAssignmentAttachment } from '../controllers/taskMessages.controller';
import { AppError as TaskUploadError } from '../utils/response';
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { requireContractorAuth } from '../middleware/contractorAuth.middleware';
import { profileImageUpload } from '../middleware/upload.middleware';
import {
  verifyToken,
  setPassword,
  selfSignup,
  savePersonalDetails,
  uploadKyc,
  saveBankDetails,
  updateSkills,
  uploadProfileAsset,
  updateProfile,
  getMyContract,
  getSigningUrl,
  signMyContract,
  rejectMyContract,
  docusignWebhook,
  getMe,
  listMyNotifications,
  markNotificationRead,
  submitInvoice,
  getMyInvoices,
} from '../controllers/contractor.controller';
import { acceptWorkerProjectContract, listWorkerProjects, listWorkerProjectTasks, } from '../controllers/projects.controller';

const router = Router();

// ── KYC file upload config ────────────────────────────────────────────────────

const kycUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 3, fields: 2 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpeg|jpg|png|webp|pdf)$/i;
    if (allowed.test(path.extname(file.originalname))) cb(null, true);
    else cb(new Error('Only JPG, PNG, and PDF files are allowed'));
  },
}).fields([
  { name: 'idFront', maxCount: 1 },
  { name: 'idBack',  maxCount: 1 },
  { name: 'selfie',  maxCount: 1 },
]);

// ── Public routes (no auth needed) ───────────────────────────────────────────

router.get ('/verify-token/:token', verifyToken);
router.post('/set-password',        setPassword);
router.post('/self-signup',         selfSignup);

// ── DocuSign webhook (signed by DocuSign, not by user JWT) ───────────────────
router.post('/docusign/webhook', docusignWebhook);

// ── Protected routes (contractor JWT required) ───────────────────────────────

router.use(requireContractorAuth);

// Onboarding
router.post('/onboarding/personal-details', savePersonalDetails);
router.post('/onboarding/kyc',              kycUpload, uploadKyc);
router.post('/onboarding/bank-details',     saveBankDetails);
router.put ('/me/skills',                   updateSkills);
router.post('/me/profile/assets',           profileImageUpload.single('image'), uploadProfileAsset);
router.put ('/me/profile',                  updateProfile);

// Contract + signing
router.get ('/contract',             getMyContract);
router.post('/contract/sign',        signMyContract);
router.post('/contract/reject',      rejectMyContract);
router.post('/contract/signing-url', getSigningUrl);

// Project delivery workspace
router.get('/projects', listWorkerProjects);
router.post('/projects/:id/accept-contract', acceptWorkerProjectContract);
router.post('/projects/:id/complete', (_req,res) => { res.status(403).json({error:{message:'The client must approve your assigned tasks to complete delivery.'}}); });
router.get('/projects/:id/tasks', listWorkerProjectTasks);
router.patch('/project-tasks/:taskId', (_req,res) => { res.status(403).json({error:{message:'Submit work for client review instead of changing task status.'}}); });

// Dashboard
router.get('/me', getMe);
router.get('/notifications', listMyNotifications);
router.post('/notifications/:id/read', markNotificationRead);

// Invoices
router.get ('/invoices',       getMyInvoices);
router.post('/invoices',       submitInvoice);

const taskFileUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 2 } }).single('attachment');
router.get('/project-tasks/:taskId/messages', listTaskMessages);
router.post('/project-tasks/:taskId/messages', (req,res,next)=>taskFileUpload(req,res,error=>next(error?new TaskUploadError('Choose one file up to 10 MB.',422,'INVALID_ATTACHMENT'):undefined)), postTaskMessage);
router.get('/project-tasks/:taskId/messages/:messageId/file', taskAttachment);

router.get('/projects/:id/team/:workerId/messages', listTeamMessages);
router.post('/projects/:id/team/:workerId/messages', (req,res,next)=>taskFileUpload(req,res,error=>next(error?new TaskUploadError('Choose one file up to 10 MB.',422,'INVALID_ATTACHMENT'):undefined)), sendTeamMessage);
router.get('/projects/:id/team/:workerId/messages/:messageId/file', downloadTeamAttachment);
router.get('/projects/:id/client/messages', listTeamMessages);
router.post('/projects/:id/client/messages', (req,res,next)=>taskFileUpload(req,res,error=>next(error?new TaskUploadError('Choose one file up to 10 MB.',422,'INVALID_ATTACHMENT'):undefined)), sendTeamMessage);
router.get('/projects/:id/client/messages/:messageId/file', downloadTeamAttachment);
router.get('/project-tasks/:taskId/attachment',downloadAssignmentAttachment);
export default router;
