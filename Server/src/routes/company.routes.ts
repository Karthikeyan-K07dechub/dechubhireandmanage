import {equipmentDeliveryFile,readEquipmentDelivery,updateEquipmentDelivery,confirmEquipmentDelivery} from '../controllers/equipmentDelivery.controller';
import {listCompanyEquipment,reviewEquipmentRequest} from '../controllers/equipmentRequests.controller';
import { listTeamMessages, sendTeamMessage, downloadTeamAttachment } from '../controllers/projectTeamMessages.controller';
import { companyTaskAttention, listTaskMessages, postTaskMessage, taskAttachment, downloadAssignmentAttachment, reviewTask } from '../controllers/taskMessages.controller';
import { AppError as TaskUploadError } from '../utils/response';
import { uploadPaymentProof } from '../controllers/paymentProof.controller';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { AppError } from '../utils/response';
import { changeCompanyPassword, uploadCompanyLogo } from '../controllers/companySettings.controller';
import { Router } from 'express';
import { createCompanyProjectRequest } from '../controllers/workers.controller';
import {
  saveIdentity,
  saveBusinessDetails,
  submitKyb,
  getKybStatus,
  saveBilling,
  createSetupIntent,
  savePreferences,
  getMyCompany,
  updateCompanyProfile,
} from '../controllers/company.controller';
import {
  listCompanyTalentRequests,
  getCompanyTalentRequest,
  acceptSuggestedTalent,
  getTalentRequestHirePrefill,
  claimShortlistedTalentRequest,
  switchShortlistedTalentRequestProfile,
  submitShortlistDecisions,
} from '../controllers/companyTalentRequests.controller';
import {
  closeCompanyProject,
  acceptProjectContract,
  createProjectTask,
  listCompanyNotifications,
  listCompanyProjects,
  listCompanyProjectTasks,
  markCompanyNotificationRead,
  submitProjectPayment,
} from '../controllers/projects.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { kybUpload } from '../middleware/upload.middleware';

const router = Router();

// All company routes require auth
router.use(requireAuth);
router.get('/equipment-requests',listCompanyEquipment);
router.get('/equipment-requests/:id/delivery-file',equipmentDeliveryFile('client'));
router.post('/equipment-requests/:id/delivery-read',readEquipmentDelivery('client'));

router.post('/equipment-requests/:id/review',reviewEquipmentRequest);

router.get  ('/me',             getMyCompany);
router.patch('/profile', updateCompanyProfile);
router.post('/change-password', rateLimit({ windowMs: 15 * 60 * 1000, max: 5, keyGenerator: req => req.user!.sub, message: { success: false, error: { message: 'Too many password change attempts. Try again in 15 minutes.' } } }), changeCompanyPassword);
const logoUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024, files: 1, fields: 0 } }).single('logo');
router.post('/logo', (req, res, next) => logoUpload(req, res, error => next(error ? new AppError('Choose one logo image up to 2 MB.', 422, 'INVALID_LOGO') : undefined)), uploadCompanyLogo);
router.post ('/identity',       saveIdentity);           // Step 2
router.post ('/business',       saveBusinessDetails);    // Step 3
router.post ('/kyb',            kybUpload, submitKyb);   // Step 4
router.get  ('/kyb/status',     getKybStatus);
router.post ('/billing/setup-intent', createSetupIntent);
router.post ('/billing',        saveBilling);            // Step 5
router.post ('/preferences',    savePreferences);        // Step 6
router.get('/task-attention',companyTaskAttention);
router.get  ('/projects', listCompanyProjects);
router.post('/projects/:id/close', closeCompanyProject);
router.post ('/project-requests', createCompanyProjectRequest);
router.post ('/projects/:id/accept-contract', acceptProjectContract);
router.get  ('/projects/:id/tasks', listCompanyProjectTasks);
const assignmentUpload=multer({storage:multer.memoryStorage(),limits:{fileSize:10*1024*1024,files:1,fields:1}}).single('attachment');
router.post('/projects/:id/tasks',(req,res,next)=>assignmentUpload(req,res,error=>next(error?new AppError('Choose one file up to 10 MB.',422,'INVALID_ATTACHMENT'):undefined)),createProjectTask);
router.post ('/projects/:id/payment-submission', submitProjectPayment);
const proofUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024, files: 1, fields: 2 } }).single('proof');
router.post('/projects/:id/payment-proof', (req, res, next) => proofUpload(req, res, error => next(error ? new AppError('Choose one PDF or image up to 2 MB.', 422, 'INVALID_PROOF') : undefined)), uploadPaymentProof);
router.get  ('/notifications', listCompanyNotifications);
router.post ('/notifications/:id/read', markCompanyNotificationRead);
router.get  ('/talent-requests', listCompanyTalentRequests);
router.post ('/talent-requests/:id/decisions', submitShortlistDecisions);
router.get  ('/talent-requests/:id', getCompanyTalentRequest);
router.post ('/talent-requests/:id/accept-suggestion', acceptSuggestedTalent);
router.post ('/talent-requests/:id/claim-shortlist', claimShortlistedTalentRequest);
router.post ('/talent-requests/:id/switch-shortlist-profile', switchShortlistedTalentRequestProfile);
router.get  ('/talent-requests/:id/hire-prefill', getTalentRequestHirePrefill);

const taskFileUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 2 } }).single('attachment');
router.get('/project-tasks/:taskId/messages', listTaskMessages);
router.post('/project-tasks/:taskId/messages', (req,res,next)=>taskFileUpload(req,res,error=>next(error?new TaskUploadError('Choose one file up to 10 MB.',422,'INVALID_ATTACHMENT'):undefined)), postTaskMessage);
router.get('/project-tasks/:taskId/messages/:messageId/file', taskAttachment);
router.post('/project-tasks/:taskId/review', reviewTask);
router.get('/projects/:id/team/:workerId/messages', listTeamMessages);
router.post('/projects/:id/team/:workerId/messages', (req,res,next)=>taskFileUpload(req,res,error=>next(error?new TaskUploadError('Choose one file up to 10 MB.',422,'INVALID_ATTACHMENT'):undefined)), sendTeamMessage);
router.get('/projects/:id/team/:workerId/messages/:messageId/file', downloadTeamAttachment);
router.get('/project-tasks/:taskId/attachment',downloadAssignmentAttachment);
export default router;
