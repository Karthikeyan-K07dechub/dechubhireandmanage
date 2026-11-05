import mongoose, { Schema } from 'mongoose';
const schema = new Schema({projectId:{type:Schema.Types.ObjectId,required:true,index:true},participants:{type:[String],required:true},senderId:{type:String,required:true},body:{type:String,default:'',maxlength:5000},attachment:{type:Schema.Types.Mixed,default:null,select:false}},{timestamps:true});
schema.index({projectId:1,participants:1,createdAt:1});
export const ProjectTeamMessage = mongoose.model('ProjectTeamMessage',schema);
