import {Request,Response,NextFunction} from 'express';
import {z} from 'zod';
import {MonthlyInvoice} from '../models/MonthlyInvoice';
import {DashboardUpdateRead} from '../models/DashboardUpdateRead';
import {invoiceUpdateVersion} from '../utils/invoiceUpdateVersion';
import {ok} from '../utils/response';
export async function adminUpdateAttention(req:Request,res:Response,next:NextFunction){try{const [rows,reads]=await Promise.all([MonthlyInvoice.find({status:{$ne:'draft'}}).lean(),DashboardUpdateRead.find({viewerId:req.user!.sub,resource:/^invoice:/}).lean()]);const seen=new Map(reads.map(r=>[r.resource,r.version]));ok(res,rows.map(r=>({resource:'invoice:'+r._id,version:invoiceUpdateVersion(r),section:'invoices'})).filter(r=>seen.get(r.resource)!==r.version));}catch(e){next(e);}}
export async function readAdminUpdateAttention(req:Request,res:Response,next:NextFunction){try{const data=z.object({items:z.array(z.object({id:z.string().regex(/^[a-f\d]{24}$/i),version:z.string().regex(/^[a-f\d]{64}$/i)})).max(100)}).parse(req.body);const rows=await MonthlyInvoice.find({_id:{$in:data.items.map(i=>i.id)}}).lean();const matching=data.items.filter(i=>rows.some(r=>String(r._id)===i.id&&invoiceUpdateVersion(r)===i.version));if(matching.length)await DashboardUpdateRead.bulkWrite(matching.map(i=>({updateOne:{filter:{viewerId:req.user!.sub,resource:'invoice:'+i.id},update:{$set:{version:i.version,seenAt:new Date()}},upsert:true}})));ok(res,{read:matching.length});}catch(e){next(e);}}
