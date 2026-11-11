import {demoAvailability,createDemoBooking,getDemoBooking,updateDemoBooking,downloadDemoCalendar} from '../controllers/demoBooking.controller';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { subscribeNewsletter } from '../controllers/newsletter.controller';

const router = Router();

const newsletterLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many subscription attempts. Please try again later.' } },
});

router.post('/newsletter/subscribe', newsletterLimiter, subscribeNewsletter);

const demoReadLimiter=rateLimit({windowMs:15*60*1000,max:200,standardHeaders:true,legacyHeaders:false});
const demoWriteLimiter=rateLimit({windowMs:60*60*1000,max:15,standardHeaders:true,legacyHeaders:false});
router.get('/demo-bookings/availability',demoReadLimiter,demoAvailability);
router.post('/demo-bookings',demoWriteLimiter,createDemoBooking);
router.get('/demo-bookings/:id',demoReadLimiter,getDemoBooking);
router.post('/demo-bookings/:id',demoWriteLimiter,updateDemoBooking);
router.get('/demo-bookings/:id/calendar',demoReadLimiter,downloadDemoCalendar);
export default router;
