import { Request, Response, NextFunction } from 'express';
import { Invoice } from '../models/Invoice';
import { Worker } from '../models/Worker';
import { ContractorNotification } from '../models/ContractorNotification';
import { uploadPaymentProofFile, downloadPaymentProofFile, removePaymentProofFile } from '../services/paymentProofStorage.service';
import { AppError, Errors, ok } from '../utils/response';
import { logger } from '../utils/logger';

export async function sendContractorPaymentProof(req:Request,res:Response,next:NextFunction) {
  try {
    const invoice=await Invoice.findById(req.params.id).select('+contractorPaymentProof');
    if(!invoice)throw Errors.NotFound('Invoice');
    if(invoice.adminReviewStatus!=='approved')throw new AppError('Approve this contractor invoice before sending payment proof.',409,'INVOICE_NOT_APPROVED');
    if(!req.file)throw new AppError('Select a payment receipt.',422,'FILE_REQUIRED');
    const worker=await Worker.findById(invoice.workerId).select('firstName lastName');
    if(!worker)throw Errors.NotFound('Contractor');
    const name=[worker.firstName,worker.lastName].filter(Boolean).join(' ').normalize('NFKD').replace(/[^a-zA-Z0-9 -]/g,'').trim().replace(/\s+/g,'-').slice(0,100)||'contractor';
    const document=await uploadPaymentProofFile(req.file,name+'-'+invoice.workerId,String(invoice._id),'sent_pay_proof_contractor');
    const old=invoice.contractorPaymentProof;
    try { invoice.contractorPaymentProof=document;invoice.contractorPaymentProofSentAt=new Date();invoice.contractorPaymentApprovedAt=null;invoice.markModified('contractorPaymentApprovedAt');await invoice.save(); }
    catch(error){await removePaymentProofFile(document).catch(()=>{});throw error;}
    if(old)await removePaymentProofFile(old).catch(error=>logger.error('Old contractor receipt cleanup failed',error));
    await ContractorNotification.create({workerId:invoice.workerId,type:'general',title:'Payment proof received',message:'Dechub sent a payment receipt for '+invoice.invoiceNumber+'.',actionUrl:'/contractor/dashboard?tab=invoices'}).catch(error=>logger.error('Payment receipt notification failed',error));
    ok(res,{message:'Payment proof sent to contractor.'});
  } catch(error){next(error);}
}

export async function downloadContractorPaymentProof(req:Request,res:Response,next:NextFunction){
  try {
    const filter=req.worker?{_id:req.params.id,workerId:req.worker.sub}:{_id:req.params.id};
    const invoice=await Invoice.findOne(filter).select('+contractorPaymentProof');
    if(!invoice?.contractorPaymentProof)throw Errors.NotFound('Payment proof');
    const file=invoice.contractorPaymentProof;
    const bytes=await downloadPaymentProofFile(file);
    res.setHeader('Content-Type',file.mimeType);
    res.setHeader('X-Payment-Proof-Version',invoice.contractorPaymentProofSentAt?.toISOString()||'');
    res.setHeader('Content-Disposition','attachment; filename="'+file.fileName+'"');
    res.setHeader('Cache-Control','private, no-store');res.send(bytes);
  }catch(error){next(error);}
}

export async function contractorPaymentProofInfo(req:Request,res:Response,next:NextFunction){try{
 if(!req.worker)throw Errors.Unauthorized();
 const invoice=await Invoice.findOne({_id:req.params.id,workerId:req.worker.sub}).select('contractorPaymentProofSentAt contractorPaymentApprovedAt');
 if(!invoice?.contractorPaymentProofSentAt)throw Errors.NotFound('Payment proof');
 ok(res,{sentAt:invoice.contractorPaymentProofSentAt,approvedAt:invoice.contractorPaymentApprovedAt});
}catch(error){next(error);}}
export async function approveContractorPayment(req:Request,res:Response,next:NextFunction){try{
 if(!req.worker)throw Errors.Unauthorized();
 const sentAt=new Date(req.body.sentAt);
 if(!req.body.sentAt||Number.isNaN(sentAt.getTime()))throw new AppError('Open the payment receipt before approving.',422,'PROOF_VERSION_REQUIRED');
 const invoice=await Invoice.findOneAndUpdate({_id:req.params.id,workerId:req.worker.sub,contractorPaymentProofSentAt:sentAt,contractorPaymentApprovedAt:null},{$set:{contractorPaymentApprovedAt:new Date()}},{new:true});
 if(!invoice){const current=await Invoice.findOne({_id:req.params.id,workerId:req.worker.sub});if(!current)throw Errors.NotFound('Invoice');if(current.contractorPaymentApprovedAt&&current.contractorPaymentProofSentAt?.getTime()===sentAt.getTime()){ok(res,{approvedAt:current.contractorPaymentApprovedAt});return;}throw new AppError('The receipt has changed. Reopen it before approving.',409,'PROOF_CHANGED');}
 ok(res,{approvedAt:invoice.contractorPaymentApprovedAt});
}catch(error){next(error);}}
