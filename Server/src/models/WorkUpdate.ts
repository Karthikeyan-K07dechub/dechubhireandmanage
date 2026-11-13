import {Schema,model} from 'mongoose';
const file=new Schema({bucket:String,path:String,fileName:String,mimeType:String,size:Number,sha256:String});
const schema=new Schema({
 workerId:{type:Schema.Types.ObjectId,ref:'Worker',required:true,index:true},companyId:{type:Schema.Types.ObjectId,ref:'Company',required:true},projectId:{type:Schema.Types.ObjectId,ref:'Project',required:true},taskId:{type:Schema.Types.ObjectId,ref:'ProjectTask',required:true},projectName:{type:String,required:true},taskName:{type:String,required:true},
 workDate:{type:String,required:true},brief:{type:String,required:true,maxlength:500},workStatus:{type:String,enum:['in_progress','blocked','ready_for_review'],required:true},submissionType:{type:String,enum:['daily','final'],default:'daily'},links:{type:[String],default:[]},notes:{type:String,default:'',maxlength:300},files:{type:[file],default:[]},
 reviewStatus:{type:String,enum:['draft','awaiting_admin_review','admin_approved','awaiting_client_review','admin_changes_requested','client_rejected','client_approved'],default:'draft'},reviewReason:{type:String,default:''},submittedAt:{type:Date,default:null},
 history:{type:[new Schema({action:String,at:{type:Date,default:Date.now},note:String},{_id:false})],default:[]},
 readVersions:{type:Map,of:Number,default:{}},
 revisions:{type:[Schema.Types.Mixed],default:[]},adminEmailQueuedAt:{type:Date,default:null},
},{timestamps:true,optimisticConcurrency:true});
schema.index({workerId:1,workDate:-1,createdAt:-1});
export const WorkUpdate=model('WorkUpdate',schema,'workupdates');
export function workUpdateView(record:any){const r=record.toObject?record.toObject():record;const publicFiles=(files:any[]=[])=>files.map(f=>({_id:f._id,fileName:f.fileName,size:f.size}));const clean={...r};delete clean.readVersions;return {...clean,files:publicFiles(r.files),revisions:(r.revisions||[]).map((v:any)=>({...v,files:publicFiles(v.files)})),version:r.__v||0};}
