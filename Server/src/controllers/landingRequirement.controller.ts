import {generateRequirementBrief,requirementBriefSchema,formatRequirementBrief} from '../services/requirementBrief.service';
import {Request,Response,NextFunction} from 'express';
import {z} from 'zod';
import {TalentRequest} from '../models/TalentRequest';
import {CompanyAuth} from '../models/CompanyAuth';
import {env} from '../config/env';
import {created,ok} from '../utils/response';
import {sendTalentRequestAdminNotificationEmail} from '../utils/email';
import {logger} from '../utils/logger';

const personalDomains=new Set(['gmail.com','googlemail.com','yahoo.com','yahoo.co.in','yahoo.co.uk','ymail.com','hotmail.com','hotmail.co.uk','outlook.com','outlook.in','icloud.com','me.com','mac.com','aol.com','protonmail.com','proton.me','pm.me','live.com','live.in','msn.com','mail.com','gmx.com','gmx.net','yandex.com','yandex.ru','rediffmail.com','rediff.com']);
const schema=z.object({brief:requirementBriefSchema.extend({location:z.string().trim().min(1,'Location is required.').max(150),experience:z.string().trim().min(1,'Experience is required.').max(150),duration:z.string().trim().min(1,'Duration is required.').max(150)}).optional(),requirement:z.string().trim().min(1,'Enter your requirement.').max(3000),email:z.string().trim().email().max(254).transform(v=>v.toLowerCase()).refine(v=>!personalDomains.has(v.split('@')[1]),'Please enter your work email.'),phone:z.string().trim().regex(/^\+?[\d\s()-]+$/,'Enter a valid phone number.').refine(v=>{const n=v.replace(/\D/g,'').length;return n>=7&&n<=15;},'Enter a valid phone number.'),companyName:z.string().trim().min(1).max(180)});
export async function createLandingRequirement(req:Request,res:Response,next:NextFunction){
 try{
  const data=schema.parse(req.body);
  const reviewedSummary=data.brief?formatRequirementBrief(data.brief):data.requirement;
  const description=data.brief?'Reviewed brief\n\n'+reviewedSummary+'\n\nOriginal requirement\n'+data.requirement:data.requirement;
  const account=await CompanyAuth.findOne({email:data.email}).select('companyId firstName lastName');
  const request=await TalentRequest.create({companyId:account?.companyId||null,workerName:'Open talent request',workerRole:'Talent or project requirement',companyName:data.companyName,companyWebsite:'',contactFirstName:account?.firstName||'Not provided',contactLastName:account?.lastName||'',phoneNumber:data.phone,email:data.email,projectName:data.brief?.title||'Project requirement',projectType:'Talent / project requirement',projectDescription:description,originalRequirement:data.requirement,requirementBrief:data.brief||null,source:'Bridge landing page',requestedServices:[]});
  // Return after the admin email is durably queued, without waiting for SMTP.
  try{await sendTalentRequestAdminNotificationEmail(env.DECHUB_ADMIN_EMAILS,{requestId:String(request._id),companyName:data.companyName,companyWebsite:'Not provided',contactFirstName:account?.firstName||'Not provided',contactLastName:account?.lastName||'',contactEmail:data.email,phoneNumber:data.phone,projectType:request.projectType,projectName:data.brief?.title,projectDescription:description,requestedServices:[],source:'Bridge landing page',dbSaveSucceeded:true});}catch(error){logger.error('Landing requirement saved but admin email could not be queued',{requestId:String(request._id),error});}
  created(res,{id:String(request._id),message:'Thanks! The Bridge team will contact you about your requirement.'});
 }catch(error){next(error);}
}

export async function generateLandingBrief(req:Request,res:Response,next:NextFunction){try{const {requirement}=z.object({requirement:z.string().trim().min(1).max(3000)}).parse(req.body);ok(res,{brief:await generateRequirementBrief(requirement)});}catch(error){next(error);}}
