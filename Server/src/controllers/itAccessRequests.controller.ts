import { Request,Response,NextFunction } from 'express';
import { z } from 'zod';
import { Project } from '../models/Project';
import { Worker } from '../models/Worker';
import { Company } from '../models/Company';
import { CompanyAuth } from '../models/CompanyAuth';
import { CompanyNotification } from '../models/CompanyNotification';
import { ITAccessRequest } from '../models/ITAccessRequest';
import { sendEmail } from '../utils/email';
import { escapeMessageHtml as esc } from '../services/messageAlerts.service';
import { env } from '../config/env';
import { AppError,Errors,ok } from '../utils/response';
import { logger } from '../utils/logger';

export async function requestITAccess(req:Request,res:Response,next:NextFunction){try{
  if(!req.worker)throw Errors.Unauthorized();
  const projectId=z.string().regex(/^[a-f0-9]{24}$/i).parse(req.params.id);
  const {message}=z.object({message:z.string().trim().min(1,'Describe the IT access you need.').max(5000)}).parse(req.body);
  const project=await Project.findOne({_id:projectId,'teamMembers.workerId':req.worker.sub});
  if(!project)throw Errors.NotFound('Project');
  if(!project.clientAcceptedAt||!project.contractorAcceptances.some(item=>String(item.workerId)===req.worker!.sub))throw new AppError('Accept your project contract before requesting IT access.',403,'PROJECT_CONTRACT_REQUIRED');
  if(!['active','payment_submitted'].includes(project.status))throw new AppError('IT access requests are available for open projects.',409,'PROJECT_CLOSED');
  const worker=await Worker.findById(req.worker.sub);
  const company=await Company.findById(project.companyId);
  if(!worker||!company)throw Errors.NotFound('Project participant');
  const client=await CompanyAuth.findById(company.ownerId);
  const route=company.itManagement==='Yes'?'client':'admin';
  const recipients=route==='client'?[client?.email||company.hrEmail||company.billingEmail].filter((email):email is string=>Boolean(email)):[...new Set(env.DECHUB_ADMIN_EMAILS.split(',').map(email=>email.trim()).filter(Boolean))];
  if(!recipients.length)throw new AppError('The request recipient is not configured. Please contact support.',503,'RECIPIENT_UNAVAILABLE');
  const record=await ITAccessRequest.create({projectId:project._id,companyId:company._id,workerId:worker._id,message,routedTo:route});
  const workerName=[worker.firstName,worker.lastName].filter(Boolean).join(' ');
  const role=project.teamMembers.find(item=>String(item.workerId)===String(worker._id))?.role||worker.roleTitle;
  const link=env.CLIENT_URL.replace(/\/$/,'')+(route==='client'?'/dashboard?tab=projects&project='+project._id+'&chatWorker='+worker._id:'/admin/talent-requests'+(project.talentRequestId?'?requestId='+project.talentRequestId:''));
  const html='<h2>IT access request</h2><p>Hello '+esc(route==='client'?(client?.firstName||company.companyName||'there'):'Dechub team')+',</p><p>'+esc(workerName)+' needs IT access for the following project.</p><p><strong>Project:</strong> '+esc(project.title)+'<br/><strong>Company:</strong> '+esc(company.companyName||'Not provided')+'<br/><strong>Contractor:</strong> '+esc(workerName)+'<br/><strong>Role:</strong> '+esc(role)+(worker.phone?.trim()?'<br/><strong>Contact:</strong> '+esc(worker.phone.trim()):'')+'<br/><strong>Company IT management:</strong> '+esc(company.itManagement||'Not specified')+'</p><h3>Requested access</h3><p style="white-space:pre-wrap">'+esc(message)+'</p><p>Send the requirements to this email - <strong>'+esc(worker.email)+'</strong></p><p>Please review this request and coordinate the required access with the contractor.</p><p><a href="'+esc(link)+'">Open Bridge dashboard</a></p><p>Thank you for your support.<br/>The Bridge team</p>';
  try{await Promise.all(recipients.map(to=>sendEmail(to,'IT access request: '+project.title+' - '+workerName,html)));await ITAccessRequest.updateOne({_id:record._id},{$set:{deliveryStatus:'sent',emailedAt:new Date()}});}
  catch(error){await ITAccessRequest.updateOne({_id:record._id},{$set:{deliveryStatus:'failed'}});logger.error('IT access request email failed',error);throw new AppError('Your request was saved, but the email could not be sent. Please try again.',502,'IT_REQUEST_EMAIL_FAILED');}
  if(route==='client')void CompanyNotification.create({companyId:company._id,projectId:project._id,type:'general',title:'IT access requested',message:workerName+': '+message.slice(0,1000),actionUrl:'/dashboard?tab=projects&project='+project._id+'&chatWorker='+worker._id}).catch(error=>logger.error('IT request notification failed',error));
  ok(res,{message:'Thank you! Your IT access request has been sent to '+(route==='client'?'the client.':'the Dechub admin team.'),requestId:record._id});
}catch(error){next(error);}}
