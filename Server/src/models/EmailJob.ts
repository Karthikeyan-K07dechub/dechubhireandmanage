import {Schema,model} from 'mongoose';
const schema=new Schema({
 to:{type:[String],required:true},delivered:{type:[String],default:[]},subject:{type:String,required:true},html:{type:String,required:true},includeLogo:{type:Boolean,default:true},
 attachments:{type:[new Schema({filename:String,content:Buffer,contentType:String},{_id:false})],default:[]},
 tracking:{kind:String,recordId:Schema.Types.ObjectId,expectedStatus:String,version:Date},
 priority:{type:Number,default:0},
 status:{type:String,enum:['queued','processing','failed','sent'],default:'queued'},attempts:{type:Number,default:0},nextAt:{type:Date,default:Date.now},leaseUntil:{type:Date,default:null},
 expiresAt:{type:Date,default:()=>new Date(Date.now()+86400000)},
},{timestamps:true});
schema.index({status:1,nextAt:1});schema.index({expiresAt:1},{expireAfterSeconds:0});
export const EmailJob=model('EmailJob',schema);
