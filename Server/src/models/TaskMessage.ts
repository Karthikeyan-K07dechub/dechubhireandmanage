import mongoose, { Schema } from 'mongoose';
const schema = new Schema({taskId:{type:Schema.Types.ObjectId,required:true,index:true},clientReadAt:{type:Date,default:null},senderRole:{type:String,enum:['client','contractor'],required:true},senderId:{type:String,required:true},body:{type:String,default:'',maxlength:5000},submission:{type:Boolean,default:false},attachment:{type:Schema.Types.Mixed,default:null,select:false}},{timestamps:true});
export const TaskMessage = mongoose.model('TaskMessage',schema);
