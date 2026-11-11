import mongoose,{Schema} from 'mongoose';
import type {InvoiceDocument} from '../services/invoiceStorage.service';
export interface MonthlyInvoiceData {
 companyId:mongoose.Types.ObjectId;projectId:mongoose.Types.ObjectId;projectName:string;companyName:string;
 billingMonth:string;invoiceNumber:string;amount:number;currency:string;dueDate:Date|null;message:string;
 kind:'original'|'additional'|'correction';correctionOf:mongoose.Types.ObjectId|null;
 status:'draft'|'sent'|'paid'|'void';document:InvoiceDocument|null;sentAt:Date|null;paidAt:Date|null;paymentReference:string|null;
 history:{action:string;at:Date;by:string;note:string}[];
 emailStatus:'pending'|'sent'|'failed';emailAction:'invoice'|'reminder';emailAttempts:number;emailNextAt:Date|null;emailLeaseUntil:Date|null;emailVersion:number;
 stripeInvoiceId?:string;stripeHostedInvoiceUrl?:string|null;stripeStatus?:string;stripeLiveMode?:boolean;receiptPending:boolean;receiptNextAt:Date|null;receiptDelivered:string[];
 createdAt:Date;updatedAt:Date;
}
const schema=new Schema<MonthlyInvoiceData>({
 stripeInvoiceId:{type:String},stripeHostedInvoiceUrl:{type:String},stripeStatus:{type:String},stripeLiveMode:{type:Boolean},receiptPending:{type:Boolean,default:false},receiptNextAt:{type:Date,default:null},receiptDelivered:{type:[String],default:[]},
 companyId:{type:Schema.Types.ObjectId,ref:'Company',required:true,index:true},projectId:{type:Schema.Types.ObjectId,ref:'Project',required:true,index:true},projectName:{type:String,required:true},companyName:{type:String,required:true},
 billingMonth:{type:String,required:true,match:/^\d{4}-(0[1-9]|1[0-2])$/},invoiceNumber:{type:String,required:true,maxlength:120},amount:{type:Number,required:true,min:0.01,max:100000000},currency:{type:String,enum:['AED','USD','INR'],required:true},dueDate:{type:Date,default:null},message:{type:String,default:'',maxlength:5000},kind:{type:String,enum:['original','additional','correction'],default:'original'},correctionOf:{type:Schema.Types.ObjectId,ref:'MonthlyInvoice',default:null},
 status:{type:String,enum:['draft','sent','paid','void'],default:'draft'},document:{type:new Schema({bucket:String,path:String,fileName:String,mimeType:String,size:Number,sha256:String},{_id:false}),default:null},sentAt:{type:Date,default:null},paidAt:{type:Date,default:null},paymentReference:{type:String,default:null,maxlength:240},
 history:{type:[new Schema({action:String,at:{type:Date,default:Date.now},by:String,note:{type:String,default:''}},{_id:false})],default:[]},
 emailStatus:{type:String,enum:['pending','sent','failed'],default:'pending'},emailAction:{type:String,enum:['invoice','reminder'],default:'invoice'},emailAttempts:{type:Number,default:0},emailNextAt:{type:Date,default:null},emailLeaseUntil:{type:Date,default:null},emailVersion:{type:Number,default:0},
},{timestamps:true,optimisticConcurrency:true});
schema.index({projectId:1,billingMonth:1},{unique:true,partialFilterExpression:{kind:'original'}});
schema.index({correctionOf:1},{unique:true,partialFilterExpression:{kind:'correction'}});
schema.index({stripeInvoiceId:1},{unique:true,sparse:true});
schema.index({companyId:1,billingMonth:1,createdAt:-1});
export const MonthlyInvoice=mongoose.model<MonthlyInvoiceData>('MonthlyInvoice',schema);
let indexes:Promise<unknown>|undefined;
export function ensureMonthlyInvoiceIndexes(){return indexes ||= MonthlyInvoice.createIndexes().catch(error=>{indexes=undefined;throw error;});}
export function monthlyInvoiceView(invoice:any){const {document,emailLeaseUntil,...data}=invoice.toObject?invoice.toObject():invoice;return {...data,documentName:document?.fileName||null};}
