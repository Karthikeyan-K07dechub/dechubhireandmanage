import {Schema,model} from 'mongoose';
const schema=new Schema({viewerId:{type:String,required:true},resource:{type:String,required:true},version:{type:String,required:true},seenAt:{type:Date,default:Date.now}});
schema.index({viewerId:1,resource:1},{unique:true});
export const DashboardUpdateRead=model('DashboardUpdateRead',schema);
