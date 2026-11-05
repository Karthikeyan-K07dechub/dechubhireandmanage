import { notifyMessageRecipients } from '../services/messageAlerts.service';
import { logger } from '../utils/logger';
import { Company } from '../models/Company';
import { CompanyAuth } from '../models/CompanyAuth';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Project } from '../models/Project';
import { ProjectTeamMessage } from '../models/ProjectTeamMessage';
import { uploadTaskAttachmentFile, downloadTaskAttachmentFile, removeTaskAttachmentFile } from '../services/taskAttachment.service';
import { Errors, AppError, ok } from '../utils/response';
async function access(req:Request){
 if(req.user || !req.params.workerId){
   const id=z.string().regex(/^[a-f0-9]{24}$/i);const project=await Project.findById(id.parse(req.params.id));if(!project)throw Errors.NotFound('Project');
   const companyKey='company:'+String(project.companyId);let workerId:string;let self:string;let peer:string;
   if(req.worker){workerId=req.worker.sub;self=workerId;peer=companyKey;if(!project.clientAcceptedAt)throw Errors.Forbidden();}
   else {const account=await CompanyAuth.findById(req.user!.sub).select('companyId');const company=account?.companyId?await Company.findById(account.companyId):await Company.findOne({ownerId:req.user!.sub});if(!company||String(company._id)!==String(project.companyId))throw Errors.Forbidden();workerId=id.parse(req.params.workerId);self=companyKey;peer=workerId;}
   if(!project.teamMembers.some(member=>String(member.workerId)===workerId))throw Errors.Forbidden();
   return {project,peer,self,participants:[companyKey,workerId].sort()};
 }
const id=z.string().regex(/^[a-f0-9]{24}$/i);const project=await Project.findById(id.parse(req.params.id));const peer=id.parse(req.params.workerId);const self=req.worker!.sub;if(!project||!project.clientAcceptedAt||self===peer||![self,peer].every(worker=>project.teamMembers.some(m=>String(m.workerId)===worker)))throw Errors.Forbidden();if(!project.contractorAcceptances.some(a=>String(a.workerId)===self))throw new AppError('Accept your project contract before messaging the team.',403,'PROJECT_CONTRACT_REQUIRED');return {project,peer,self,participants:[self,peer].sort()};}
export async function listTeamMessages(req:Request,res:Response,next:NextFunction){try{const {project,self,participants}=await access(req);const rows=await ProjectTeamMessage.find({projectId:project._id,participants:{$all:participants}}).select('+attachment').sort({createdAt:1});ok(res,rows.map(row=>({_id:row._id,body:row.body,senderRole:'contractor',own:row.senderId===self,createdAt:row.createdAt,fileName:row.attachment?.fileName||null})));}catch(e){next(e);}}
export async function sendTeamMessage(req:Request,res:Response,next:NextFunction){let attachment:any;let saved=false;try{const {project,self,peer,participants}=await access(req);const body=z.string().trim().max(5000).parse(req.body.body||'');if(!body&&!req.file)throw new AppError('Add a message, link, or file.',422,'MESSAGE_REQUIRED');if(req.file)attachment=await uploadTaskAttachmentFile(req.file,String(project.companyId),'team/'+project._id);const row=await ProjectTeamMessage.create({projectId:project._id,participants,senderId:self,body,attachment});saved=true;void notifyMessageRecipients({companyId:String(project.companyId),projectId:String(project._id),projectTitle:project.title,senderRole:req.worker?'contractor':'client',senderId:req.worker?.sub||req.user!.sub,body,fileName:attachment?.fileName,recipientWorkerIds:peer.startsWith('company:')?undefined:[peer]}).catch(error=>logger.error('Project message notification failed',error));ok(res,{messageId:row._id});}catch(e){if(attachment&&!saved)await removeTaskAttachmentFile(attachment).catch(()=>{});next(e);}}
export async function downloadTeamAttachment(req:Request,res:Response,next:NextFunction){try{const {project,participants}=await access(req);const row=await ProjectTeamMessage.findOne({_id:req.params.messageId,projectId:project._id,participants:{$all:participants}}).select('+attachment');if(!row?.attachment)throw Errors.NotFound('Attachment');const bytes=await downloadTaskAttachmentFile(row.attachment);res.setHeader('Content-Type','application/octet-stream');res.setHeader('Content-Disposition','attachment; filename="'+row.attachment.fileName+'"');res.setHeader('Cache-Control','private, no-store');res.send(bytes);}catch(e){next(e);}}
