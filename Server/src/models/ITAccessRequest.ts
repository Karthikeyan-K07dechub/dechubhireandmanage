import mongoose, { Schema } from 'mongoose';

const schema=new Schema({
  projectId:{type:Schema.Types.ObjectId,ref:'Project',required:true,index:true},
  companyId:{type:Schema.Types.ObjectId,ref:'Company',required:true},
  workerId:{type:Schema.Types.ObjectId,ref:'Worker',required:true,index:true},
  message:{type:String,required:true,maxlength:5000},
  status:{type:String,enum:['pending','in_progress','waiting_for_contractor','granted','rejected','revoked'],default:'pending'},
  accessUrl:{type:String,default:''},
  lastContractorMessageId:{type:String,default:'request'},
  clientReadMessageId:{type:String,default:null},
  entries:{type:[new Schema({sender:{type:String,enum:['client','contractor'],required:true},name:{type:String,required:true},text:{type:String,required:true,maxlength:2000},status:{type:String},previousStatus:{type:String},createdAt:{type:Date,default:Date.now},adminEmailNextAt:{type:Date,default:null},adminEmailAttempts:{type:Number,default:0},adminEmailDelivered:{type:[String],default:[]}})],default:[]},
  routedTo:{type:String,enum:['client','admin'],required:true},
  deliveryStatus:{type:String,enum:['pending','sent','failed'],default:'pending'},
  emailedAt:{type:Date,default:null},
},{timestamps:true});
schema.index({companyId:1,updatedAt:-1});
schema.index({workerId:1,projectId:1,updatedAt:-1});
export const ITAccessRequest=mongoose.model('ITAccessRequest',schema);
