import {Schema,model} from 'mongoose';
const schema=new Schema({requestId:{type:Schema.Types.ObjectId,required:true},workerId:{type:Schema.Types.ObjectId,required:true,index:true},projectTitle:{type:String,required:true},scope:{type:String,required:true},paymentTerms:{type:String,required:true},deliverables:[String],agreedAmount:{type:Number,required:true,min:0.01},currency:{type:String,enum:['USD','INR','AED'],required:true},sentAt:{type:Date,required:true},acceptedAt:{type:Date,default:null},revision:{type:Number,default:1}},{timestamps:true});
schema.index({requestId:1,workerId:1},{unique:true});
export const TalentRequestContract=model('TalentRequestContract',schema);
