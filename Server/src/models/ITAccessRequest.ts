import mongoose, { Schema } from 'mongoose';

const schema=new Schema({
  projectId:{type:Schema.Types.ObjectId,ref:'Project',required:true,index:true},
  companyId:{type:Schema.Types.ObjectId,ref:'Company',required:true},
  workerId:{type:Schema.Types.ObjectId,ref:'Worker',required:true,index:true},
  message:{type:String,required:true,maxlength:5000},
  routedTo:{type:String,enum:['client','admin'],required:true},
  deliveryStatus:{type:String,enum:['pending','sent','failed'],default:'pending'},
  emailedAt:{type:Date,default:null},
},{timestamps:true});
export const ITAccessRequest=mongoose.model('ITAccessRequest',schema);
