import {Request,Response,NextFunction} from 'express';
import {z} from 'zod';
import {EquipmentRequest} from '../models/EquipmentRequest';
import {Project} from '../models/Project';
import {Company} from '../models/Company';
import {CompanyAuth} from '../models/CompanyAuth';
import {Worker} from '../models/Worker';
import {CompanyNotification} from '../models/CompanyNotification';
import {ContractorNotification} from '../models/ContractorNotification';
import {queueEmail} from '../services/emailQueue.service';
import {escapeMessageHtml as esc} from '../services/messageAlerts.service';
import {env} from '../config/env';
import {AppError,Errors,ok,created} from '../utils/response';
import {logger} from '../utils/logger';

const id=z.string().regex(/^[a-f0-9]{24}$/i);
async function companyFor(req:Request){
 const account=await CompanyAuth.findById(req.user!.sub).select('companyId');
 const company=account?.companyId?await Company.findById(account.companyId):await Company.findOne({ownerId:req.user!.sub});
 if(!company)throw Errors.NotFound('Company');return company;
}
function view(row:any,contractor=false){
 const {deliveryFile,rejectionReason,reviewedBy,adminEmailStatus,adminEmailSentAt,...rest}=row.toObject?row.toObject():row;
 if(rest.projectId&&typeof rest.projectId==='object'&&rest.projectId.status){rest.projectStatus=rest.projectId.status;rest.projectId=rest.projectId._id;}
 return contractor?rest:{...rest,rejectionReason,reviewedBy,adminEmailStatus,adminEmailSentAt};
}
async function emailAdmin(record:any){
 const subject=record.status==='pending'?'New equipment request':record.status==='approved'?'Client approved equipment request':'Client rejected equipment request';
 const link=env.CLIENT_URL.replace(/\/$/,'')+'/admin/talent-requests?equipment='+record._id;
 const text=record.status==='pending'?'A contractor submitted an equipment request for client review.':record.status==='approved'?'The client has approved this equipment request. Please coordinate equipment management.':'The client rejected this request due to: '+record.rejectionReason+'. Please contact the contractor.';
 const rows=[['Contractor',record.contractorName],['Contractor email',record.contractorEmail],['Project',record.projectName],['Company',record.companyName],['Equipment',record.equipmentType==='Other'?(record.otherEquipment||'Other'):record.equipmentType],['Reason',record.reason],['Specifications',record.specifications],['Additional details',record.details],['Client decision',record.status],...(record.rejectionReason?[['Rejection reason',record.rejectionReason]]:[])];
 const html='<h2>'+esc(subject)+'</h2><p>'+esc(text)+'</p><table>'+rows.map(([label,value])=>'<tr><th style="text-align:left;padding:8px">'+esc(label)+'</th><td style="padding:8px;white-space:pre-wrap">'+esc(String(value||'Not specified'))+'</td></tr>').join('')+'</table><p><a href="'+esc(link)+'">View equipment request</a></p><p>Thank you,<br/>Bridge equipment management</p>';
 try{
  const recipients=[...new Set(env.DECHUB_ADMIN_EMAILS.split(',').map(v=>v.trim()).filter(Boolean))];
  if(!recipients.length)throw Error('No admin email configured');
  await EquipmentRequest.updateOne({_id:record._id,status:record.status},{$set:{adminEmailStatus:'pending',adminEmailSentAt:null}});
  await queueEmail(recipients,subject+': '+record.projectName,html,{tracking:{kind:'equipment_admin',recordId:String(record._id),expectedStatus:record.status}});return true;
 }catch(error){await EquipmentRequest.updateOne({_id:record._id,status:record.status},{$set:{adminEmailStatus:'failed'}});logger.error('Equipment request admin email failed',error);return false;}
}

export async function createEquipmentRequest(req:Request,res:Response,next:NextFunction){try{
 if(!req.worker)throw Errors.Unauthorized();
 const data=z.object({projectId:id,equipmentType:z.enum(['Laptop','Monitor','Headset','Other']),otherEquipment:z.string().trim().max(200).default(''),reason:z.string().trim().min(1).max(2000),specifications:z.string().trim().max(3000).default(''),details:z.string().trim().max(5000).default('')}).parse(req.body);
 if(data.equipmentType==='Other'&&!data.otherEquipment)throw new AppError('Specify the equipment you need.',422,'VALIDATION_ERROR');
 if(data.equipmentType!=='Other')data.otherEquipment='';
 const project=await Project.findOne({_id:data.projectId,'teamMembers.workerId':req.worker.sub});
 if(!project)throw Errors.NotFound('Project');
 if(!project.clientAcceptedAt||!project.contractorAcceptances.some(a=>String(a.workerId)===req.worker!.sub))throw new AppError('Accept your project contract before requesting equipment.',403,'CONTRACT_REQUIRED');
 if(!['active','payment_submitted'].includes(project.status))throw new AppError('Equipment can only be requested for an open project.',409,'PROJECT_CLOSED');
 const worker=await Worker.findById(req.worker.sub);const company=await Company.findById(project.companyId);
 if(!worker||!company)throw Errors.NotFound('Project participant');
 const record=await EquipmentRequest.create({...data,companyId:company._id,workerId:worker._id,projectName:project.title,companyName:company.companyName||'Company details not provided',contractorName:[worker.firstName,worker.lastName].filter(Boolean).join(' '),contractorEmail:worker.email});
 await CompanyNotification.create({companyId:company._id,projectId:project._id,type:'general',title:'Equipment request awaiting approval',message:record.contractorName+' requested '+(record.otherEquipment||record.equipmentType)+' for '+record.projectName+'.',actionUrl:'/dashboard?tab=equipment&request='+record._id}).catch(e=>logger.error('Equipment client notification failed',e));
 const emailed=await emailAdmin(record);
 created(res,{request:view(record,true),message:'Equipment request submitted for client review.',emailWarning:emailed?null:'Request saved. Admin email delivery needs retry.'});
}catch(error){next(error);}}

export async function listContractorEquipment(req:Request,res:Response,next:NextFunction){try{
 if(!req.worker)throw Errors.Unauthorized();ok(res,(await EquipmentRequest.find({workerId:req.worker.sub}).sort({createdAt:-1}).limit(500).populate('projectId','status')).map(r=>view(r,true)));
}catch(e){next(e);}}
export async function listCompanyEquipment(req:Request,res:Response,next:NextFunction){try{
 const company=await companyFor(req);ok(res,(await EquipmentRequest.find({companyId:company._id}).sort({createdAt:-1}).limit(500).populate('projectId','status')).map(r=>view(r)));
}catch(e){next(e);}}
export async function listAdminEquipment(_req:Request,res:Response,next:NextFunction){try{
 const records=await EquipmentRequest.find({}).sort({createdAt:-1}).limit(500).populate('projectId','status').populate({path:'companyId',select:'ownerId',populate:{path:'ownerId',select:'email phone'}});
 ok(res,records.map(record=>{
  const company=record.companyId as unknown as {_id:unknown;ownerId?:{email?:string;phone?:string}}|null;
  return {...view(record),companyId:company?._id||null,clientEmail:company?.ownerId?.email||null,clientPhone:company?.ownerId?.phone||null};
 }));
}catch(e){next(e);}}

export async function reviewEquipmentRequest(req:Request,res:Response,next:NextFunction){try{
 const company=await companyFor(req);const requestId=id.parse(req.params.id);
 const data=z.object({decision:z.enum(['approved','rejected']),reason:z.string().trim().max(2000).optional()}).parse(req.body);
 if(data.decision==='rejected'&&!data.reason)throw new AppError('Provide a reason for rejecting this equipment request.',422,'REASON_REQUIRED');
 const record=await EquipmentRequest.findOneAndUpdate({_id:requestId,companyId:company._id,status:'pending'},{$set:{status:data.decision,rejectionReason:data.decision==='rejected'?data.reason:null,reviewedAt:new Date(),reviewedBy:req.user!.email,adminEmailStatus:'pending',adminEmailSentAt:null}},{new:true,runValidators:true});
 if(!record)throw new AppError('Request not found or already reviewed. Refresh and try again.',409,'REQUEST_ALREADY_REVIEWED');
 await ContractorNotification.create({workerId:record.workerId,type:'general',title:data.decision==='approved'?'Equipment request: client approved':'Equipment request update',message:data.decision==='approved'?'The client approved your equipment request for '+record.projectName+'. Dechub admin will coordinate the next steps.':'Admin will contact you about your equipment request for '+record.projectName+'.',actionUrl:'/contractor/dashboard?tab=equipment&request='+record._id}).catch(e=>logger.error('Equipment contractor notification failed',e));
 const emailed=await emailAdmin(record);ok(res,{request:view(record),emailWarning:emailed?null:'Decision saved. Admin email delivery needs retry.'});
}catch(e){next(e);}}
export async function retryEquipmentEmail(req:Request,res:Response,next:NextFunction){try{
 const record=await EquipmentRequest.findById(id.parse(req.params.id));if(!record)throw Errors.NotFound('Equipment request');
 if(record.adminEmailStatus==='sent')throw new AppError('This email has already been sent.',409,'EMAIL_ALREADY_SENT');
 if(!await emailAdmin(record))throw new AppError('Unable to email admin. Please try again later.',502,'EMAIL_FAILED');
 ok(res,{message:'Admin email sent.'});
}catch(e){next(e);}}

export async function readAdminEquipment(req:Request,res:Response,next:NextFunction){try{
 const record=await EquipmentRequest.findOneAndUpdate({_id:id.parse(req.params.id)},{$set:{adminReadAt:new Date()}},{new:true});
 if(!record)throw Errors.NotFound('Equipment request');ok(res,view(record));
}catch(error){next(error);}}
