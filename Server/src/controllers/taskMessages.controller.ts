import { notifyMessageRecipients } from '../services/messageAlerts.service';
import { logger } from '../utils/logger';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { CompanyAuth } from '../models/CompanyAuth';
import { Company } from '../models/Company';
import { Project } from '../models/Project';
import { ProjectTask } from '../models/ProjectTask';
import { TaskMessage } from '../models/TaskMessage';
import { ContractorNotification } from '../models/ContractorNotification';
import { uploadTaskAttachmentFile, downloadTaskAttachmentFile, removeTaskAttachmentFile } from '../services/taskAttachment.service';
import { recordWorkerDeliveryCompletion } from './projects.controller';
import { Errors, AppError, ok } from '../utils/response';
async function access(req: Request) {
 const task = await ProjectTask.findById(z.string().regex(/^[a-f0-9]{24}$/i).parse(req.params.taskId)); if(!task) throw Errors.NotFound('Task');
 const project = await Project.findById(task.projectId); if(!project) throw Errors.NotFound('Project');
 if(req.worker){if(!task.assigneeWorkerIds.some(id=>String(id)===req.worker!.sub)||!project.teamMembers.some(m=>String(m.workerId)===req.worker!.sub)||!project.clientAcceptedAt||!project.contractorAcceptances.some(a=>String(a.workerId)===req.worker!.sub))throw Errors.Forbidden();}
 else {const account=await CompanyAuth.findById(req.user!.sub).select('companyId');const company=account?.companyId?await Company.findById(account.companyId):await Company.findOne({ownerId:req.user!.sub});if(!company||String(company._id)!==String(project.companyId))throw Errors.Forbidden();}
 return {task,project};
}
export async function listTaskMessages(req: Request,res: Response,next: NextFunction){try{await access(req);if(!req.worker) await TaskMessage.updateMany({taskId:req.params.taskId,senderRole:'contractor',clientReadAt:null},{$set:{clientReadAt:new Date()}});const rows=await TaskMessage.find({taskId:req.params.taskId,$nor:[{senderRole:'client',body:'Task assignment attachment',attachment:{$ne:null}}]}).select('+attachment').sort({createdAt:1});ok(res,rows.map(row=>{const {attachment,...rest}=row.toObject();return {...rest,fileName:attachment?.fileName||null};}));}catch(e){next(e);}}
export async function postTaskMessage(req: Request,res: Response,next: NextFunction){let attachment:any;let saved=false;try{
 const {task,project}=await access(req);const body=z.string().trim().max(5000).parse(req.body.body||'');const submission=req.worker&&req.body.submission==='true';
 if(!body&&!req.file)throw new AppError('Enter a message, link, or attach a file.',422,'MESSAGE_REQUIRED');
 if(submission && (task.status === 'completed' || !['active','payment_submitted'].includes(project.status))) throw new AppError('This task is already closed for completion review. You can still send messages and files.',409,'TASK_CLOSED');
 if(req.file)attachment=await uploadTaskAttachmentFile(req.file,String(project.companyId),'tasks/'+String(task._id));
 const message=await TaskMessage.create({taskId:task._id,senderRole:req.worker?'contractor':'client',senderId:req.worker?.sub||req.user!.sub,body,submission:Boolean(submission),attachment});saved=true;
 if(submission){task.status='submitted';await task.save();}
 void notifyMessageRecipients({companyId:String(project.companyId),projectId:String(project._id),projectTitle:project.title,senderRole:req.worker?'contractor':'client',senderId:req.worker?.sub||req.user!.sub,body,fileName:attachment?.fileName,taskId:String(task._id),taskTitle:task.title,submission:Boolean(submission),recipientWorkerIds:req.worker?undefined:task.assigneeWorkerIds.map(String)}).catch(error=>logger.error('Task message notification failed',error));
 ok(res,{messageId:message._id});
 }catch(e){if(attachment&&!saved)await removeTaskAttachmentFile(attachment).catch(()=>{});next(e);}}
export async function taskAttachment(req: Request,res: Response,next: NextFunction){try{await access(req);const row=await TaskMessage.findOne({_id:req.params.messageId,taskId:req.params.taskId}).select('+attachment');if(!row?.attachment)throw Errors.NotFound('Attachment');const bytes=await downloadTaskAttachmentFile(row.attachment);res.setHeader('Content-Type','application/octet-stream');res.setHeader('Content-Disposition','attachment; filename="'+row.attachment.fileName+'"');res.setHeader('Cache-Control','private, no-store');res.send(bytes);}catch(e){next(e);}}
export async function reviewTask(req: Request,res: Response,next: NextFunction){try{
 const {task,project}=await access(req);const decision=z.enum(['approve','changes']).parse(req.body.decision);
 if(!['active','payment_submitted'].includes(project.status))throw new AppError('Project is closed.',409,'PROJECT_CLOSED');
 if (task.status === 'completed') throw new AppError('This task is already approved.',409,'TASK_ALREADY_COMPLETED');
 if(decision === 'changes' && task.status !== 'submitted') throw new AppError('Wait for a submission before requesting a revision.',409,'SUBMISSION_REQUIRED');
 const updated=await ProjectTask.findOneAndUpdate({_id:task._id,status:task.status},{$set:{status:decision==='approve'?'completed':'in_progress',completedAt:decision==='approve'?new Date():null}},{new:true});if(!updated)throw new AppError('Task has changed. Refresh and retry.',409,'TASK_CHANGED');
 await TaskMessage.create({taskId:task._id,senderRole:'client',senderId:req.user!.sub,body:decision==='approve'?'Client approved task completion.':'Client requested changes. Please revise and resubmit.'});
 if(decision==='approve')for(const id of task.assigneeWorkerIds){if(await ProjectTask.countDocuments({projectId:project._id,assigneeWorkerIds:id,status:{$ne:'completed'}})===0)await recordWorkerDeliveryCompletion(project,String(id));}
 await ContractorNotification.insertMany(task.assigneeWorkerIds.map(workerId=>({workerId,type:'general',title:decision==='approve'?'Task approved':'Task changes requested',message:task.title,actionUrl:'/contractor/dashboard?tab=projects&project='+project._id})));
 ok(res,updated.toObject());
 }catch(e){next(e);}}

export async function downloadAssignmentAttachment(req:Request,res:Response,next:NextFunction){try{
 const {task}=await access(req);const stored=await ProjectTask.findById(task._id).select('+assignmentAttachment');
 const legacy=stored?.assignmentAttachment?null:await TaskMessage.findOne({taskId:task._id,senderRole:'client',body:'Task assignment attachment'}).select('+attachment');
 const file=stored?.assignmentAttachment||legacy?.attachment;if(!file)throw Errors.NotFound('Task attachment');
 const bytes=await downloadTaskAttachmentFile(file);res.setHeader('Content-Type','application/octet-stream');res.setHeader('Content-Disposition','attachment; filename="'+file.fileName+'"');res.setHeader('Cache-Control','private, no-store');res.send(bytes);
}catch(error){next(error);}}

export async function companyTaskAttention(req:Request,res:Response,next:NextFunction){try{
 const account=await CompanyAuth.findById(req.user!.sub).select('companyId');
 const company=account?.companyId?await Company.findById(account.companyId):await Company.findOne({ownerId:req.user!.sub});if(!company)throw Errors.Forbidden();
 const projects=await Project.find({companyId:company._id}).select('_id');
 const tasks=await ProjectTask.find({projectId:{$in:projects.map(p=>p._id)}}).select('_id projectId status');
 const unread=await TaskMessage.aggregate([{$match:{taskId:{$in:tasks.map(t=>t._id)},senderRole:'contractor',clientReadAt:null}},{$group:{_id:'$taskId',count:{$sum:1},submission:{$max:'$submission'}}}]);
 const counts=new Map(unread.map(row=>[String(row._id),row]));
 ok(res,tasks.filter(t=>t.status==='submitted'||counts.has(String(t._id))).map(t=>({taskId:String(t._id),projectId:String(t.projectId),unread:counts.get(String(t._id))?.count||0,submitted:t.status==='submitted'})));
}catch(error){next(error);}}
