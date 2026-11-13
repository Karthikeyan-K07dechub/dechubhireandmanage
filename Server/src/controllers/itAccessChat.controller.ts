import {processITAccessAdminEmails} from '../services/itAccessAdminEmail.service';
import {Request,Response,NextFunction} from 'express';
import {z} from 'zod';
import {Types} from 'mongoose';
import {ITAccessRequest} from '../models/ITAccessRequest';
import {Company} from '../models/Company';
import {CompanyAuth} from '../models/CompanyAuth';
import {Project} from '../models/Project';
import {Worker} from '../models/Worker';
import {CompanyNotification} from '../models/CompanyNotification';
import {ContractorNotification} from '../models/ContractorNotification';
import {Errors,AppError,ok} from '../utils/response';
import {logger} from '../utils/logger';
const id=z.string().regex(/^[a-f\d]{24}$/i);
async function companyFor(req:Request){
 if(!req.user)throw Errors.Unauthorized();
 const account=await CompanyAuth.findById(req.user.sub).select('companyId');
 const company=account?.companyId?await Company.findById(account.companyId):await Company.findOne({ownerId:req.user.sub});
 if(!company)throw Errors.NotFound('Company');return company;
}
async function scope(req:Request){return req.worker?{workerId:req.worker.sub}:{companyId:(await companyFor(req))._id};}
async function authorized(req:Request){
 const request=await ITAccessRequest.findOne({_id:id.parse(req.params.requestId),...await scope(req)});
 if(!request)throw Errors.NotFound('IT access request');
 const project=await Project.findOne({_id:request.projectId,companyId:request.companyId,'teamMembers.workerId':request.workerId});
 if(!project)throw Errors.NotFound('Project participant');
 return {request,project};
}
function view(request:any){const row=request.toObject?request.toObject():request;const lastContractorMessageId=row.lastContractorMessageId||'request';return {...row,lastContractorMessageId,hasUnread:row.clientReadMessageId!==lastContractorMessageId,status:row.status||'pending',entries:(row.entries||[]).map(({adminEmailNextAt,adminEmailAttempts,adminEmailDelivered,...entry}:any)=>entry),version:row.__v||0};}
export async function readITAccessChat(req:Request,res:Response,next:NextFunction){try{
 if(req.worker)throw Errors.Forbidden();
 const {messageId}=z.object({messageId:z.string().regex(/^(request|[a-f\d]{24})$/i)}).parse(req.body);
 const {request}=await authorized(req);
 // Acknowledge only the message the client actually opened. A reply arriving
 // between loading and reading must keep its unread dot.
 const result=await ITAccessRequest.updateOne({_id:request._id,companyId:request.companyId,$or:[{lastContractorMessageId:messageId},...(messageId==='request'?[{lastContractorMessageId:{$exists:false}}]:[])]},{$set:{clientReadMessageId:messageId}},{timestamps:false});
 ok(res,{read:result.matchedCount===1,messageId});
}catch(error){next(error);}}
export async function listITAccessChats(req:Request,res:Response,next:NextFunction){try{
 const filter:any=await scope(req);if(req.query.projectId)filter.projectId=id.parse(req.query.projectId);
 const requests=await ITAccessRequest.find(filter).select('-entries').sort({updatedAt:-1}).limit(200).lean();
 const projectIds=requests.map(r=>r.projectId),workerIds=requests.map(r=>r.workerId);
 const [projects,workers]=await Promise.all([Project.find({_id:{$in:projectIds}}).select('title companyId teamMembers status startDate targetEndDate').lean(),Worker.find({_id:{$in:workerIds}}).select('firstName lastName email country roleTitle').lean()]);
 ok(res,requests.filter(r=>projects.some(p=>String(p._id)===String(r.projectId)&&String(p.companyId)===String(r.companyId)&&p.teamMembers.some(m=>String(m.workerId)===String(r.workerId)))).map(r=>{
 const worker=workers.find(w=>String(w._id)===String(r.workerId));const project=projects.find(p=>String(p._id)===String(r.projectId));return {...view(r),projectName:project?.title||'Project',contractorName:worker?[worker.firstName,worker.lastName].filter(Boolean).join(' '):'Contractor',contractorEmail:worker?.email||'',country:worker?.country||'',role:project?.teamMembers.find(m=>String(m.workerId)===String(r.workerId))?.role||worker?.roleTitle||'',projectStatus:project?.status||'',startDate:project?.startDate||null,endDate:project?.targetEndDate||null};
 }));
}catch(error){next(error);}}
export async function getITAccessChat(req:Request,res:Response,next:NextFunction){try{const {request,project}=await authorized(req);ok(res,{...view(request),readOnly:!['active','payment_submitted'].includes(project.status)});}catch(error){next(error);}}
export async function postITAccessChat(req:Request,res:Response,next:NextFunction){try{
 const data=z.object({text:z.string().trim().max(2000).default(''),status:z.enum(['pending','in_progress','waiting_for_contractor','granted','rejected','revoked']).optional(),version:z.number().int().min(0).optional(),accessUrl:z.string().trim().max(2000).url().refine(v=>{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password;},'Use an HTTPS invitation or tool URL.').optional()}).parse(req.body);
 if(!data.text)throw new AppError('Enter a reply or an explanation for the status update.',422,'MESSAGE_REQUIRED');
 if(req.worker&&(data.status||data.accessUrl))throw Errors.Forbidden();
 if(data.accessUrl&&data.status!=='granted')throw new AppError('Share an access link only when marking access granted.',422,'GRANT_REQUIRED');
 if(data.status&&data.version===undefined)throw new AppError('Reload the request before updating its status.',409,'IT_REQUEST_CHANGED');
 const {request,project}=await authorized(req);
 if(!['active','payment_submitted'].includes(project.status))throw new AppError('This project is closed. Its IT access history is read-only.',409,'PROJECT_CLOSED');
 const sender=req.worker?'contractor':'client';
 const worker=req.worker?await Worker.findById(req.worker.sub):null;
 if(worker?.status==='terminated')throw Errors.Forbidden();
 const name=req.worker?[worker?.firstName,worker?.lastName].filter(Boolean).join(' ')||'Contractor':req.user?.email||'Client';
 const entryId=new Types.ObjectId();
 const updated=await ITAccessRequest.findOneAndUpdate({_id:request._id,...(data.status?{__v:data.version}:{}),$expr:{$lt:[{$size:{$ifNull:['$entries',[]]}},500]}},{$push:{entries:{_id:entryId,sender,name,text:data.text,status:data.status,previousStatus:request.status||'pending',createdAt:new Date(),adminEmailNextAt:new Date(),adminEmailAttempts:0,adminEmailDelivered:[]}},$inc:{__v:1},...(data.status?{$set:{status:data.status,...(data.accessUrl?{accessUrl:data.accessUrl}:data.status!=='granted'?{accessUrl:''}:{})}}:req.worker?{$set:{lastContractorMessageId:String(entryId)}}:{})},{new:true,runValidators:true});
 if(!updated)throw new AppError('The request changed or its conversation limit was reached. Reload before trying again.',409,'IT_REQUEST_CHANGED');
 const note={title:data.status?'IT access: '+data.status.replace(/_/g,' '):'IT access reply',message:(project.title+': '+data.text).slice(0,450),type:'general',actionUrl:req.worker?'/dashboard?tab=it-access&request='+request._id:'/contractor/dashboard?tab=projects&project='+project._id+'&itAccess=1&request='+request._id};
 const notification=req.worker?CompanyNotification.create({...note,companyId:request.companyId,projectId:project._id}):ContractorNotification.create({...note,workerId:request.workerId});
 void notification.catch(error=>logger.error('IT access reply notification failed',error));
 void processITAccessAdminEmails().catch(error=>logger.error('IT access email queue failed',error));
 ok(res,view(updated));
}catch(error){next(error);}}
