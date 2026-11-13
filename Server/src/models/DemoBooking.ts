import mongoose,{Schema} from 'mongoose';
const schema=new Schema({
 firstName:{type:String,required:true},lastName:{type:String,required:true},email:{type:String,required:true},
 deliveryMode:{type:String,enum:['client_managed','bridge_managed'],default:null},
 projectStage:{type:String,enum:['existing_project','new_project'],default:null},
 employeeCount:{type:String,required:true},country:{type:String,required:true},website:{type:String,required:true},phone:{type:String,required:true},
 requestedServices:{type:[String],default:[]},startAt:{type:Date,required:true},hostEmail:{type:String,default:'prasanna@dechub.in'},
 status:{type:String,enum:['scheduled','cancelled'],default:'scheduled'},managementHash:{type:String,required:true,unique:true},
 talentRequestId:{type:Schema.Types.ObjectId,ref:'TalentRequest',default:null},sequence:{type:Number,default:0},
 guestEmailStatus:{type:String,default:'pending'},hostEmailStatus:{type:String,default:'pending'},
},{timestamps:true});
schema.index({hostEmail:1,startAt:1},{unique:true,partialFilterExpression:{status:'scheduled'}});
export const DemoBooking=mongoose.model('DemoBooking',schema);

let indexesReady:Promise<unknown>|null=null;
export function ensureDemoBookingIndexes(){
 if(!indexesReady)indexesReady=DemoBooking.createIndexes().catch(error=>{indexesReady=null;throw error;});
 return indexesReady;
}
