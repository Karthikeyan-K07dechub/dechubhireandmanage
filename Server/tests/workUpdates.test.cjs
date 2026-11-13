const assert=require('node:assert/strict');
process.chdir(require('node:path').join(__dirname,'..'));
const {WorkUpdate,workUpdateView}=require('../dist/models/WorkUpdate');
const {Worker}=require('../dist/models/Worker');
const {Project}=require('../dist/models/Project');
const {ProjectTask}=require('../dist/models/ProjectTask');
const c=require('../dist/controllers/workUpdates.controller');
const workerId='aaaaaaaaaaaaaaaaaaaaaaaa',projectId='bbbbbbbbbbbbbbbbbbbbbbbb',taskId='cccccccccccccccccccccccc';
let assigned=true,saved,existing=null,deliveryMode='bridge_managed',taskWrites=0,completionResets=0;
ProjectTask.updateOne=async()=>{taskWrites++;};Project.updateOne=async()=>{completionResets++;};require('../dist/models/CompanyNotification').CompanyNotification.create=async()=>{};
Worker.findById=async()=>({_id:workerId,status:'active'});
Project.findOne=async()=>assigned?{_id:projectId,companyId:workerId,title:'Assigned project',status:'active',deliveryMode,contractorAcceptances:[{workerId}]}:null;
ProjectTask.findOne=async()=>assigned?{_id:taskId,title:'Assigned task'}:null;
WorkUpdate.findOne=async()=>existing;
WorkUpdate.prototype.save=async function(){saved=this;return this;};
async function call(payload,updateId){let data,error;await c.saveWorkUpdate({worker:{sub:workerId},params:{id:updateId},body:{payload:JSON.stringify(payload)},files:[]},{status(){return this;},json(v){data=v.data;}},e=>error=e);return{data,error};}
(async()=>{
 assert.throws(()=>c.validateWorkDate('2026-02-30'));
 assert.throws(()=>c.validateWorkDate('2999-01-01'));
 c.validateWorkDate('2020-02-29');
 Project.find=()=>({select(){return this;},sort(){return this;},lean:async()=>[{_id:projectId,title:'Legacy project',status:'active'}]});
 ProjectTask.find=()=>({select(){return this;},lean:async()=>[]});
 let options,optionsError;await c.workUpdateOptions({worker:{sub:workerId}},{status(){return this;},json(v){options=v.data;}},e=>optionsError=e);assert.ifError(optionsError);assert.equal(options[0].canSubmit,false,'Missing acceptance records must remain read-only instead of crashing');
 const payload={projectId,taskId,workDate:'2020-02-29',brief:'Implemented the login form.',workStatus:'ready_for_review',submissionType:'daily',action:'draft'};
 assigned=false;assert.equal((await call(payload)).error.statusCode,404);
 assigned=true;let result=await call(payload);assert.ifError(result.error);assert.equal(saved.reviewStatus,'draft');assert.equal(saved.submittedAt,null);
 result=await call({...payload,action:'submit'});assert.ifError(result.error);assert.equal(saved.reviewStatus,'awaiting_admin_review');assert.ok(saved.submittedAt);
 existing=saved;existing.$isNew=false;existing.__v=1;result=await call({...payload,version:0},String(saved._id));assert.equal(result.error.statusCode,409,'Stale edits must be rejected');result=await call({...payload,action:'submit',version:1,links:['https://example.test/demo']},String(saved._id));assert.ifError(result.error);assert.equal(saved.reviewStatus,'awaiting_admin_review');assert.equal(saved.links[0],'https://example.test/demo');assert.equal(saved.revisions.length,1,'Previous submission is retained');
 const view=workUpdateView({files:[{_id:'file',fileName:'proof.pdf',size:10,path:'private',bucket:'private',sha256:'secret'}],revisions:[{files:[{fileName:'old.pdf',path:'private'}]}]});assert.equal(view.files[0].path,undefined);assert.equal(view.revisions[0].files[0].path,undefined);
 existing=null;deliveryMode='client_managed';result=await call({...payload,action:'submit'});assert.ifError(result.error);assert.equal(saved.reviewStatus,'awaiting_client_review');
 result=await call({...payload,submissionType:'final',action:'draft'});assert.ifError(result.error);assert.equal(taskWrites,0,'A new final draft must not withdraw task approval');result=await call({...payload,submissionType:'final',action:'submit'});assert.ifError(result.error);assert.equal(taskWrites,1);assert.equal(completionResets,1,'Final resubmission withdraws prior completion');
 console.log('Work updates: date validation, assignment restrictions, draft/submit states, submitted locking and private metadata checks passed.');
 // Notification delivery is tested separately through the email queue, without sending real email.
 process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
