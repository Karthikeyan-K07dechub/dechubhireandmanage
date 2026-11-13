import {Request,Response,NextFunction} from 'express';
import {z} from 'zod';
import {Project} from '../models/Project';
import {Worker} from '../models/Worker';
import {ContractorNotification} from '../models/ContractorNotification';
import {AppError,Errors,ok} from '../utils/response';
import {queueEmail} from '../services/emailQueue.service';
import {escapeMessageHtml as esc} from '../services/messageAlerts.service';
import {logger} from '../utils/logger';
const id=z.string().regex(/^[a-f\d]{24}$/i);
const input=z.object({scope:z.string().trim().min(3).max(10000),paymentTerms:z.string().trim().min(3).max(1200),deliverables:z.array(z.string().trim().min(1).max(600)).min(1).max(50),agreedAmount:z.number().finite().positive(),version:z.number().int().nonnegative()});
async function context(req:Request){const project=await Project.findOne({_id:id.parse(req.params.id),'teamMembers.workerId':id.parse(req.params.workerId)});if(!project)throw Errors.NotFound('Assigned project talent');const member=project.teamMembers.find(m=>String(m.workerId)===req.params.workerId)!;const worker=await Worker.findById(member.workerId).select('firstName lastName email status');if(!worker)throw Errors.NotFound('Talent');return {project,member,worker};}
export async function getTalentProjectContract(req:Request,res:Response,next:NextFunction){try{const {project,member,worker}=await context(req);ok(res,{projectTitle:project.title,talentName:[worker.firstName,worker.lastName].join(' '),role:member.role,currency:project.currency,agreedAmount:member.agreedAmount??0,scope:member.talentContract?.scope??project.scope,paymentTerms:member.talentContract?.paymentTerms??project.paymentTerms,deliverables:member.talentContract?.deliverables??project.deliverables,version:project.__v??0,accepted:!!project.contractorAcceptances?.some(a=>String(a.workerId)===String(member.workerId)),canSend:!!project.clientAcceptedAt&&['active','payment_submitted'].includes(project.status)&&worker.status!=='terminated'});}catch(e){next(e);}}
export async function sendTalentProjectContract(req:Request,res:Response,next:NextFunction){try{
 const data=input.parse(req.body),{project,member,worker}=await context(req);
 if(!project.clientAcceptedAt||!['active','payment_submitted'].includes(project.status)||worker.status==='terminated')throw new AppError('The client must accept the project contract before sending a talent contract. Completed projects are read-only.',409,'PROJECT_NOT_READY');
 if(project.contractorAcceptances?.some(a=>String(a.workerId)===String(member.workerId)))throw new AppError('This talent has already accepted the contract. Accepted terms cannot be replaced.',409,'CONTRACT_ACCEPTED');
 const updated=await Project.findOneAndUpdate({_id:project._id,__v:data.version,'teamMembers.workerId':member.workerId,'contractorAcceptances.workerId':{$ne:member.workerId},status:{$in:['active','payment_submitted']}},{$set:{'teamMembers.$.talentContract':{scope:data.scope,paymentTerms:data.paymentTerms,deliverables:data.deliverables,sentAt:new Date()},'teamMembers.$.agreedAmount':data.agreedAmount},$inc:{__v:1}},{new:true,runValidators:true});
 if(!updated)throw new AppError('The project changed. Close and reopen the form before sending.',409,'PROJECT_CHANGED');
 const actionUrl='/contractor/dashboard?tab=contract&project='+project._id;
 await ContractorNotification.create({workerId:worker._id,type:'contract_pending',title:'Review your project contract',message:'Your contract for '+project.title+' is ready to review.',actionUrl});
 // Delivery uses the existing persistent queue and does not delay the form response.
 void queueEmail(worker.email,'Project contract: '+project.title,'<h2>Your project contract is ready</h2><p>Hi '+esc(worker.firstName)+',</p><p>Review the contract for <strong>'+esc(project.title)+'</strong> in your Bridge dashboard under Contracts.</p><p>Agreed amount: '+esc(project.currency)+' '+data.agreedAmount+'</p>').catch(e=>logger.error('Talent contract email queue failed',e));
 ok(res,{sent:true});
}catch(e){next(e);}}
