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
router.get  ('/projects', listCompanyProjects);
router.post ('/project-requests', createCompanyProjectRequest);
router.post ('/projects/:id/accept-contract', acceptProjectContract);
router.get  ('/projects/:id/tasks', listCompanyProjectTasks);
router.post ('/projects/:id/tasks', createProjectTask);
router.post ('/projects/:id/payment-submission', submitProjectPayment);
router.get  ('/notifications', listCompanyNotifications);
router.post ('/notifications/:id/read', markCompanyNotificationRead);
router.get  ('/talent-requests', listCompanyTalentRequests);
router.post ('/talent-requests/:id/decisions', submitShortlistDecisions);
router.get  ('/talent-requests/:id', getCompanyTalentRequest);
router.post ('/talent-requests/:id/accept-suggestion', acceptSuggestedTalent);
router.post ('/talent-requests/:id/claim-shortlist', claimShortlistedTalentRequest);
router.post ('/talent-requests/:id/switch-shortlist-profile', switchShortlistedTalentRequestProfile);
router.get  ('/talent-requests/:id/hire-prefill', getTalentRequestHirePrefill);

export default router;
