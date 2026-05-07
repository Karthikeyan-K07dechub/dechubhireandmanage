import { Router } from 'express';
import {
  saveIdentity,
  saveBusinessDetails,
  submitKyb,
  getKybStatus,
  saveBilling,
  createSetupIntent,
  savePreferences,
  getMyCompany,
} from '../controllers/company.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { kybUpload } from '../middleware/upload.middleware';

const router = Router();

// All company routes require auth
router.use(requireAuth);

router.get  ('/me',             getMyCompany);
router.post ('/identity',       saveIdentity);           // Step 2
router.post ('/business',       saveBusinessDetails);    // Step 3
router.post ('/kyb',            kybUpload, submitKyb);   // Step 4
router.get  ('/kyb/status',     getKybStatus);
router.post ('/billing/setup-intent', createSetupIntent);
router.post ('/billing',        saveBilling);            // Step 5
router.post ('/preferences',    savePreferences);        // Step 6

export default router;