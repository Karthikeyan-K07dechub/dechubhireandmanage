import {Request,Response,NextFunction} from 'express';
import {z} from 'zod';
import {DemoBooking,ensureDemoBookingIndexes} from '../models/DemoBooking';
import {TalentRequest} from '../models/TalentRequest';
import {CompanyAuth} from '../models/CompanyAuth';
import {sendEmail} from '../utils/email';
import {env} from '../config/env';
import {AppError,Errors,created,ok} from '../utils/response';
import {escapeMessageHtml as esc} from '../services/messageAlerts.service';
import {queueBookDemoSubmissionToGoogleSheets} from '../services/googleSheets.service';
import {DEMO_HOST,DEMO_DURATION,hashBookingToken,validDemoSlot,demoCalendar} from '../services/demoBooking.service';
import {logger} from '../utils/logger';
const tokenSchema=z.string().uuid();
const personalDomains=new Set(['gmail.com','googlemail.com','yahoo.com','yahoo.co.in','yahoo.co.uk','ymail.com','rocketmail.com','hotmail.com','hotmail.co.uk','outlook.com','outlook.in','icloud.com','me.com','mac.com','aol.com','protonmail.com','proton.me','pm.me','live.com','live.in','msn.com','mail.com','email.com','gmx.com','gmx.net','yandex.com','yandex.ru','rediffmail.com','rediff.com','zoho.com','zohomail.com','tuta.com','tutanota.com']);
const schema=z.object({firstName:z.string().trim().min(1).max(80),lastName:z.string().trim().min(1).max(80),email:z.string().trim().email().max(254).transform(value=>value.toLowerCase()).refine(value=>!personalDomains.has(value.split('@')[1]),'Please enter your work email.'),deliveryMode:z.enum(['client_managed','bridge_managed']).optional(),projectStage:z.enum(['existing_project','new_project']),employeeCount:z.enum(['1-20','21-200','201-1000','1001-2000','2001+']),country:z.string().trim().min(2).max(100),website:z.string().trim().max(300).transform(value=>/^https?:\/\//i.test(value)?value:'https://'+value).refine(value=>{try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)&&url.hostname.includes('.')&&!url.username&&!url.password;}catch{return false;}},'Enter a valid company website.'),phone:z.string().trim().regex(/^[+\d][\d\s()-]{6,24}$/),requestedServices:z.array(z.string().trim().min(1).max(120)).max(20).default([]),startAt:z.string().datetime(),token:tokenSchema});
function publicBooking(booking:any){return {id:String(booking._id),firstName:booking.firstName,lastName:booking.lastName,email:booking.email,projectStage:booking.projectStage??null,startAt:booking.startAt,duration:DEMO_DURATION,sequence:booking.sequence,host:DEMO_HOST,status:booking.status,guestEmailStatus:booking.guestEmailStatus,hostEmailStatus:booking.hostEmailStatus};}
async function scoped(req:Request){const id=z.string().regex(/^[a-f0-9]{24}$/i).parse(req.params.id);const token=tokenSchema.parse(req.body?.token||req.query.token);const booking=await DemoBooking.findOne({_id:id,managementHash:hashBookingToken(token)});if(!booking)throw Errors.NotFound('Booking');return {booking,token};}
type BookingEvent='scheduled'|'rescheduled'|'cancelled';
async function deliver(booking:any,token:string,event:BookingEvent,previousStartAt?:Date){
 const manage=env.CLIENT_URL.replace(/\/$/,'')+'/book-demo?booking='+booking._id+'&token='+encodeURIComponent(token);
 const when=new Date(booking.startAt).toLocaleString('en-IN',{timeZone:'Asia/Kolkata',dateStyle:'full',timeStyle:'short'})+' IST';
 const subject=event==='cancelled'?'Bridge demo cancelled':event==='rescheduled'?'Your Bridge demo has been rescheduled':'Your meeting has been booked | Bridge Demo';

 const html='<h2>'+esc(subject)+'</h2><p>Hello '+esc(booking.firstName)+',</p><p>'+(event==='cancelled'?'Your Bridge demo meeting has been cancelled.':event==='rescheduled'?'Your Bridge demo meeting has been rescheduled. Please find your updated meeting details below.':'Thank you for booking a demo with Bridge! Your meeting has been booked successfully. We look forward to learning about your business and showing you how Bridge can support your team.')+'</p><p><strong>When:</strong> '+esc(when)+'<br/><strong>Duration:</strong> 30 minutes<br/><strong>Host:</strong> Prasanna — prasanna@dechub.in<br/><strong>Guest:</strong> '+esc(booking.firstName+' '+booking.lastName)+' — '+esc(booking.email)+'</p>'+(booking.status==='scheduled'?'<p>Prasanna will share the online meeting joining details by email.</p>':'')+'<p><strong>Hiring for:</strong> '+esc(booking.projectStage==='existing_project'?'Existing project':booking.projectStage==='new_project'?'New project':'Not specified')+'<br/><strong>Company website:</strong> '+esc(booking.website)+'<br/><strong>Employees:</strong> '+esc(booking.employeeCount)+'<br/><strong>Country:</strong> '+esc(booking.country)+'<br/><strong>Contact:</strong> '+esc(booking.phone)+'</p><p><a href="'+esc(manage)+'">View booking, reschedule or cancel</a></p><p><a href="https://bridge.dechub.ai/company/login">Log in to Bridge to check your request status</a></p><p>Thank you,<br/>The Bridge team</p>';

 const company=new URL(booking.website).hostname.replace(/^www\./,'');
 const formatWhen=(value:Date)=>value.toLocaleString('en-IN',{timeZone:'Asia/Kolkata',dateStyle:'full',timeStyle:'short'})+' IST';
 const adminSubject='Bridge demo '+event+': '+company+' - '+booking.firstName+' '+booking.lastName;
 const adminHtml='<h2>'+esc('Bridge demo '+event)+'</h2><h3>Company and contact details</h3><p><strong>Company domain:</strong> '+esc(company)+'<br/><strong>Website:</strong> '+esc(booking.website)+'<br/><strong>Contact name:</strong> '+esc(booking.firstName+' '+booking.lastName)+'<br/><strong>Work email:</strong> '+esc(booking.email)+'<br/><strong>Phone:</strong> '+esc(booking.phone)+'<br/><strong>Employees:</strong> '+esc(booking.employeeCount)+'<br/><strong>Country:</strong> '+esc(booking.country)+'<br/><strong>Hiring for:</strong> '+esc(booking.projectStage==='existing_project'?'Existing project':booking.projectStage==='new_project'?'New project':'Not specified')+'<br/><strong>Requested services:</strong> '+esc((booking.requestedServices||[]).join(', ')||'Bridge walkthrough')+'</p><h3>Meeting details</h3><p><strong>Meeting:</strong> '+esc(booking.firstName+' x Prasanna | Bridge Demo')+'<br/><strong>Status:</strong> '+esc(event)+'<br/><strong>Start:</strong> '+esc(when)+'<br/><strong>End:</strong> '+esc(formatWhen(new Date(new Date(booking.startAt).getTime()+DEMO_DURATION*60000)))+'<br/><strong>Duration:</strong> '+DEMO_DURATION+' minutes<br/><strong>Time zone:</strong> Asia/Kolkata (IST)<br/><strong>Host:</strong> Prasanna - '+esc(DEMO_HOST.email)+'<br/><strong>Location:</strong> Online meeting<br/><strong>Booking reference:</strong> '+esc(String(booking._id))+'</p>'+(event==='rescheduled'&&previousStartAt?'<p><strong>Previous meeting time:</strong> '+esc(formatWhen(previousStartAt))+'</p>':'')+(event==='cancelled'?'<p>This meeting has been cancelled.</p>':'<p>Prasanna will share the meeting joining details by email.</p>')+'<p><a href="'+esc(manage)+'">View booking details</a></p>';
 const attachments=[{filename:'bridge-demo.ics',content:Buffer.from(demoCalendar(booking)),contentType:'text/calendar'}];
 const staff=[...new Set([DEMO_HOST.email,...env.DECHUB_ADMIN_EMAILS.split(',').map(value=>value.trim().toLowerCase()).filter(Boolean)])];
 const results=await Promise.allSettled([sendEmail(booking.email,subject,html,{attachments}),Promise.all(staff.map(to=>sendEmail(to,adminSubject,adminHtml,{attachments})))]);
 const statuses={guestEmailStatus:results[0].status==='fulfilled'?'sent':'failed',hostEmailStatus:results[1].status==='fulfilled'?'sent':'failed'};
 await DemoBooking.updateOne({_id:booking._id,sequence:booking.sequence},{$set:statuses});
 results.forEach(result=>{if(result.status==='rejected')logger.error('Demo booking email failed',result.reason);});return statuses;
}
function deliverInBackground(booking:any,token:string,event:BookingEvent,previousStartAt?:Date){
 // Keep the saved booking response independent of slow email providers.
 const snapshot=booking.toObject?booking.toObject():{...booking};
 setImmediate(()=>{void deliver(snapshot,token,event,previousStartAt).catch(error=>logger.error('Demo booking email delivery failed',error));});
}
export async function demoAvailability(req:Request,res:Response,next:NextFunction){try{
 const month=z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).parse(req.query.month);
 const [year,m]=month.split('-').map(Number);const now=new Date();const days=new Date(Date.UTC(year,m,0)).getUTCDate();
 const start=new Date(Date.UTC(year,m-1,1)-330*60000),end=new Date(Date.UTC(year,m,1)-330*60000);
 if(end<now||start.getTime()>now.getTime()+91*86400000){ok(res,{slots:[],timezone:'Asia/Kolkata'});return;}
 const booked=await DemoBooking.find({hostEmail:DEMO_HOST.email,status:'scheduled',startAt:{$gte:start,$lt:end}}).select('startAt');
 const occupied=new Set(booked.map(row=>row.startAt.toISOString()));const slots:string[]=[];
 for(let day=1;day<=days;day++)for(let minutes=540;minutes<=1110;minutes+=30){const date=new Date(Date.UTC(year,m-1,day,0,minutes)-330*60000);if(validDemoSlot(date,now)&&!occupied.has(date.toISOString()))slots.push(date.toISOString());}
 res.setHeader('Cache-Control','no-store');ok(res,{slots,timezone:'Asia/Kolkata',duration:DEMO_DURATION});
}catch(error){next(error);}}
export async function createDemoBooking(req:Request,res:Response,next:NextFunction){try{
 const data=schema.parse(req.body);if(data.projectStage==='new_project'&&!data.deliveryMode)throw new AppError('Choose how your project will be delivered.',422,'DELIVERY_MODE_REQUIRED');if(data.projectStage==='existing_project')data.deliveryMode='client_managed';const startAt=new Date(data.startAt);const managementHash=hashBookingToken(data.token);
 const existing=await DemoBooking.findOne({managementHash});if(existing){if(existing.email!==data.email||existing.startAt.getTime()!==startAt.getTime())throw new AppError('This booking request was already used.',409,'BOOKING_CONFLICT');ok(res,publicBooking(existing));return;}
 if(!validDemoSlot(startAt))throw new AppError('Choose an available future time.',409,'SLOT_UNAVAILABLE');
 await ensureDemoBookingIndexes();let booking;
 try{booking=await DemoBooking.create({...data,token:undefined,startAt,managementHash,hostEmail:DEMO_HOST.email});}catch(error){if((error as {code?:number}).code===11000)throw new AppError('This time was just booked. Please choose another time.',409,'SLOT_UNAVAILABLE');throw error;}
 let lead;
 try{
  const account=await CompanyAuth.findOne({email:data.email}).select('companyId');const description='Bridge demo with Prasanna on '+startAt.toISOString()+'. Hiring for: '+(data.projectStage==='existing_project'?'Existing project':'New project')+'. Delivery: '+(data.deliveryMode==='bridge_managed'?'Bridge delivers the entire project':'Talents work with the client team')+'. Employees: '+data.employeeCount+'. Country: '+data.country+'. Services: '+(data.requestedServices.join(', ')||'Bridge walkthrough')+'.';
  lead=await TalentRequest.create({companyId:account?.companyId||null,workerName:'Book a demo',workerRole:'Bridge product walkthrough',companyName:new URL(data.website).hostname.replace(/^www\./,''),companyWebsite:data.website,contactFirstName:data.firstName,contactLastName:data.lastName,phoneNumber:data.phone,email:data.email,deliveryMode:data.deliveryMode,projectStage:data.projectStage,projectType:'Bridge demo',projectName:'Bridge demo with Prasanna',projectDescription:description,requestedServices:data.requestedServices});
  booking.talentRequestId=lead._id;await booking.save();
  queueBookDemoSubmissionToGoogleSheets({submittedAt:new Date().toISOString(),companyName:lead.companyName,companyWebsite:data.website,contactName:data.firstName+' '+data.lastName,workEmail:data.email,phoneNumber:data.phone,projectType:'Bridge demo',projectDescription:description,requestedServices:data.requestedServices,dbSaveStatus:'saved',requestId:String(lead._id)});
 }catch(error){if(lead)await TalentRequest.deleteOne({_id:lead._id});await DemoBooking.deleteOne({_id:booking._id});throw error;}
 created(res,publicBooking(booking));deliverInBackground(booking,data.token,'scheduled');
}catch(error){next(error);}}
export async function getDemoBooking(req:Request,res:Response,next:NextFunction){try{const {booking}=await scoped(req);res.setHeader('Cache-Control','no-store');ok(res,publicBooking(booking));}catch(error){next(error);}}
export async function updateDemoBooking(req:Request,res:Response,next:NextFunction){try{
 const {booking,token}=await scoped(req);const data=z.object({action:z.enum(['cancel','reschedule']),startAt:z.string().datetime().optional()}).parse(req.body);
 await ensureDemoBookingIndexes();
 if(booking.status==='cancelled')throw new AppError('This booking has been cancelled.',409,'BOOKING_CANCELLED');
 if(booking.startAt.getTime()<=Date.now())throw new AppError('Contact Prasanna to change a meeting that has already started.',409,'BOOKING_STARTED');
 const previousStartAt=new Date(booking.startAt);
 const change:any={status:'cancelled',guestEmailStatus:'pending',hostEmailStatus:'pending'};
 if(data.action==='reschedule'){if(!data.startAt||!validDemoSlot(new Date(data.startAt)))throw new AppError('Choose an available future time.',409,'SLOT_UNAVAILABLE');change.status='scheduled';change.startAt=new Date(data.startAt);}
 let updated;try{updated=await DemoBooking.findOneAndUpdate({_id:booking._id,sequence:booking.sequence,status:'scheduled'},{$set:change,$inc:{sequence:1}},{new:true,runValidators:true});}catch(error){if((error as {code?:number}).code===11000)throw new AppError('This time was just booked. Please choose another time.',409,'SLOT_UNAVAILABLE');throw error;}
 if(!updated)throw new AppError('Booking changed. Reload and try again.',409,'BOOKING_CONFLICT');
 ok(res,publicBooking(updated));deliverInBackground(updated,token,data.action==='reschedule'?'rescheduled':'cancelled',previousStartAt);
}catch(error){next(error);}}
export async function downloadDemoCalendar(req:Request,res:Response,next:NextFunction){try{const {booking}=await scoped(req);res.setHeader('Content-Type','text/calendar; charset=utf-8');res.setHeader('Content-Disposition','attachment; filename="bridge-demo.ics"');res.setHeader('Cache-Control','private, no-store');res.send(demoCalendar(booking));}catch(error){next(error);}}
