import {sendEmail} from '../utils/email';
import {escapeMessageHtml as esc} from '../services/messageAlerts.service';
import {env} from '../config/env';
import {Request,Response,NextFunction} from 'express';
import {z} from 'zod';
import {EquipmentRequest} from '../models/EquipmentRequest';
import {CompanyAuth} from '../models/CompanyAuth';
import {Company} from '../models/Company';
import {CompanyNotification} from '../models/CompanyNotification';
import {ContractorNotification} from '../models/ContractorNotification';
import {uploadPaymentProofFile,downloadPaymentProofFile,removePaymentProofFile,PaymentProofFile} from '../services/paymentProofStorage.service';
import {AppError,Errors,ok} from '../utils/response';
import {logger} from '../utils/logger';

type Role='admin'|'client'|'contractor';
const requestId=z.string().regex(/^[a-f0-9]{24}$/i);
async function scoped(req:Request,role:Role){
 const filter:any={_id:requestId.parse(req.params.id)};
 if(role==='contractor'){if(!req.worker)throw Errors.Unauthorized();filter.workerId=req.worker.sub;}
 if(role==='client'){
  if(!req.user)throw Errors.Unauthorized();
  const account=await CompanyAuth.findById(req.user.sub).select('companyId');
  const company=account?.companyId?await Company.findById(account.companyId):await Company.findOne({ownerId:req.user.sub});
  if(!company)throw Errors.NotFound('Company');filter.companyId=company._id;
 }
 const record=await EquipmentRequest.findOne(filter).select('+deliveryFile');
 if(!record)throw Errors.NotFound('Equipment request');return record;
}
export async function updateEquipmentDelivery(req:Request,res:Response,next:NextFunction){try{
 const data=z.object({status:z.enum(['delivered','ready_to_return','return_completed']),message:z.string().trim().min(1).max(5000),confirmation:z.literal('yes').optional()}).parse(req.body);
 if(data.status==='return_completed'&&data.confirmation!=='yes')throw new AppError('Confirm that the equipment has been returned.',422,'RETURN_CONFIRMATION_REQUIRED');
 const record=await scoped(req,'admin');
 if(record.status==='pending')throw new AppError('Wait for the client decision before updating equipment.',409,'DECISION_REQUIRED');
 const transitions:Record<string,string[]>={'':['delivered'],delivered:['ready_to_return'],ready_to_return:['return_completed'],return_completed:[]};
 const previous=record.deliveryStatus||'';
 if(!transitions[previous]?.includes(data.status))throw new AppError('Equipment status has changed or this transition is not allowed. Refresh and try again.',409,'INVALID_TRANSITION');
 if(data.status==='delivered'&&!req.file)throw new AppError('Attach a delivery image or PDF.',422,'FILE_REQUIRED');
 if(data.status==='ready_to_return'&&req.file)throw new AppError('Return requests use a message only.',422,'UNEXPECTED_FILE');
 let file:PaymentProofFile|undefined;
 if(req.file)file=await uploadPaymentProofFile(req.file,'equipment-deliveries',String(record._id));
 const now=new Date();
 const update:any={deliveryStatus:data.status,deliveryMessage:data.message,deliveryUpdatedAt:now,clientDeliveryReadAt:null,contractorDeliveryReadAt:null};
 if(data.status==='ready_to_return'){update.clientDeliveryReadAt=now;update.returnResponse=null;update.returnReason='';update.returnRespondedAt=null;update.returnEmailStatus='pending';update.returnResponseEmailStatus=null;}
 if(data.status==='delivered'){update.clientDeliveryConfirmedAt=null;update.contractorDeliveryConfirmedAt=null;}
 if(file)Object.assign(update,{deliveryFile:file,deliveryFileName:file.fileName,deliveryMimeType:file.mimeType});
 let updated;
 try{updated=await EquipmentRequest.findOneAndUpdate({_id:record._id,deliveryStatus:previous||null},{$set:update,$push:{deliveryHistory:{status:data.status,message:data.message,updatedAt:now,updatedBy:req.user?.email||'Admin'}}},{new:true,runValidators:true});}
 catch(error){if(file)await removePaymentProofFile(file).catch(()=>{});throw error;}
 if(!updated){if(file)await removePaymentProofFile(file).catch(()=>{});throw new AppError('This equipment was updated. Refresh and try again.',409,'UPDATE_CONFLICT');}
 if(file&&record.deliveryFile)await removePaymentProofFile(record.deliveryFile as PaymentProofFile).catch(error=>logger.error('Equipment file cleanup failed',error));
 const label={delivered:'Equipment delivered',ready_to_return:'Equipment ready to return?',return_completed:'Equipment return completed'}[data.status];
 await Promise.allSettled([
  ...(data.status==='ready_to_return'?[]:[CompanyNotification.create({companyId:record.companyId,projectId:record.projectId,type:'general',title:label,message:(record.projectName+': '+data.message).slice(0,500),actionUrl:'/dashboard?tab=equipment&request='+record._id})]),
  ContractorNotification.create({workerId:record.workerId,type:'general',title:label,message:(record.projectName+': '+data.message).slice(0,500),actionUrl:'/contractor/dashboard?tab=equipment&request='+record._id}),
 ]).then(results=>results.forEach(result=>{if(result.status==='rejected')logger.error('Equipment delivery notification failed',result.reason);}));
 let emailWarning:null|string=null;
 if(data.status==='ready_to_return'){
  try{await sendEmail(record.contractorEmail,'Ready to return equipment? - '+record.projectName,'<h2>Ready to return your equipment?</h2><p>Project: '+esc(record.projectName)+'</p><p style="white-space:pre-wrap">'+esc(data.message)+'</p><p>Please open My Equipment and choose Yes or No. If No, explain why.</p><p><a href="'+esc(env.CLIENT_URL.replace(/\/$/,'')+'/contractor/dashboard?tab=equipment&request='+record._id)+'">Respond to return request</a></p><p>Thank you,<br/>Bridge equipment management</p>');await EquipmentRequest.updateOne({_id:record._id,deliveryUpdatedAt:now},{$set:{returnEmailStatus:'sent'}});}
  catch(error){await EquipmentRequest.updateOne({_id:record._id,deliveryUpdatedAt:now},{$set:{returnEmailStatus:'failed'}});logger.error('Equipment return email failed',error);emailWarning='Return request saved, but the contractor email could not be sent.';}
 }
 ok(res,{message:data.status==='ready_to_return'?'Return request sent to contractor.':'Equipment update sent to the client and contractor.',emailWarning});
}catch(error){next(error);}}
export const equipmentDeliveryFile=(role:Role)=>async(req:Request,res:Response,next:NextFunction)=>{try{
 const record=await scoped(req,role);const file=record.deliveryFile as PaymentProofFile|null;
 if(!file)throw Errors.NotFound('Delivery file');
 const bytes=await downloadPaymentProofFile(file);
 res.setHeader('Content-Type',file.mimeType);res.setHeader('Content-Disposition','attachment; filename="'+file.fileName+'"');res.setHeader('Cache-Control','private, no-store');res.send(bytes);
}catch(error){next(error);}};
export const readEquipmentDelivery=(role:'client'|'contractor')=>async(req:Request,res:Response,next:NextFunction)=>{try{
 const record=await scoped(req,role);
 const version=z.string().datetime().parse(req.body.version);
 const result=await EquipmentRequest.updateOne({_id:record._id,deliveryUpdatedAt:new Date(version)},{$set:{[role==='client'?'clientDeliveryReadAt':'contractorDeliveryReadAt']:new Date()}});
 if(!result.matchedCount)throw new AppError('The update changed. Reopen it.',409,'UPDATE_CHANGED');
 const actionUrl=(role==='client'?'/dashboard':'/contractor/dashboard')+'?tab=equipment&request='+record._id;
 if(role==='client')await CompanyNotification.updateMany({companyId:record.companyId,actionUrl,readAt:null,createdAt:{$lte:new Date(version)}},{$set:{readAt:new Date()}});
 else await ContractorNotification.updateMany({workerId:record.workerId,actionUrl,readAt:null,createdAt:{$lte:new Date(version)}},{$set:{readAt:new Date()}});
 ok(res,{message:'Update viewed.'});
}catch(error){next(error);}};
export async function confirmEquipmentDelivery(req:Request,res:Response,next:NextFunction){try{
 const record=await scoped(req,'contractor');const version=z.string().datetime().parse(req.body.version);
 const updated=await EquipmentRequest.findOneAndUpdate({_id:record._id,deliveryStatus:'delivered',deliveryUpdatedAt:new Date(version)},{$set:{contractorDeliveryConfirmedAt:new Date(),contractorDeliveryReadAt:new Date()}},{new:true});
 if(!updated)throw new AppError('The delivery update changed. Reopen it before confirming.',409,'UPDATE_CHANGED');ok(res,{message:'Delivery confirmed.'});
}catch(error){next(error);}}

export async function respondEquipmentReturn(req:Request,res:Response,next:NextFunction){try{
 const record=await scoped(req,'contractor');
 const data=z.object({version:z.string().datetime(),answer:z.enum(['yes','no']),reason:z.string().trim().max(2000).default('')}).parse(req.body);
 if(data.answer==='no'&&!data.reason)throw new AppError('Explain why you are not ready to return the equipment.',422,'REASON_REQUIRED');
 const updated=await EquipmentRequest.findOneAndUpdate({_id:record._id,workerId:req.worker!.sub,deliveryStatus:'ready_to_return',deliveryUpdatedAt:new Date(data.version),returnResponse:null},{$set:{returnResponse:data.answer,returnResponseEmailStatus:data.answer==='yes'?'pending':null,returnReason:data.answer==='no'?data.reason:'',returnRespondedAt:new Date(),contractorDeliveryReadAt:new Date()}},{new:true});
 if(!updated)throw new AppError('This request changed or you already responded. Refresh and reopen it.',409,'RETURN_RESPONSE_CONFLICT');
 let emailWarning:null|string=null;
 if(data.answer==='yes'){
  const equipment=record.otherEquipment||record.equipmentType;
  const link=env.CLIENT_URL.replace(/\/$/,'')+'/admin/talent-requests?equipment='+record._id;
  const rows=[['Contractor',record.contractorName],['Contractor email',record.contractorEmail],['Company',record.companyName],['Project',record.projectName],['Equipment',equipment],['Response','Yes - ready to return'],['Responded at',new Date().toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})+' IST']];
  const html='<h2>Contractor ready to return equipment</h2><p>Hello Admin,</p><p>The contractor has confirmed that they are ready to return the equipment. Please contact the contractor to arrange collection.</p><table>'+rows.map(([label,value])=>'<tr><th style="text-align:left;padding:8px">'+esc(label)+'</th><td style="padding:8px">'+esc(String(value||'Not provided'))+'</td></tr>').join('')+'</table><p><a href="'+esc(link)+'">View equipment request</a></p><p>Thank you,<br/>Bridge equipment management</p>';
  try{
   const recipients=[...new Set(env.DECHUB_ADMIN_EMAILS.split(',').map(value=>value.trim()).filter(Boolean))];
   if(!recipients.length)throw Error('Admin email is not configured');
   await Promise.all(recipients.map(to=>sendEmail(to,'Equipment return confirmed - '+record.projectName,html)));
   await EquipmentRequest.updateOne({_id:record._id,returnRespondedAt:updated.returnRespondedAt},{$set:{returnResponseEmailStatus:'sent'}});
  }catch(error){await EquipmentRequest.updateOne({_id:record._id,returnRespondedAt:updated.returnRespondedAt},{$set:{returnResponseEmailStatus:'failed'}});logger.error('Equipment return response email failed',error);emailWarning='Your response was saved, but the admin email could not be sent.';}
 }
 ok(res,{message:data.answer==='yes'?'Thank you. Your readiness to return is recorded.':'Your reason has been sent to admin.',emailWarning});
}catch(error){next(error);}}
