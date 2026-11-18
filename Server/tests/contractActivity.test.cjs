const assert=require('node:assert/strict');
process.chdir(require('node:path').join(__dirname,'..'));
const {Project}=require('../dist/models/Project'),{Company}=require('../dist/models/Company'),{CompanyAuth}=require('../dist/models/CompanyAuth');
const c=require('../dist/controllers/projects.controller');
const companyId='bbbbbbbbbbbbbbbbbbbbbbbb';let writes=0,lastFilter;
const project={_id:'aaaaaaaaaaaaaaaaaaaaaaaa',companyId,contractSentAt:new Date(),contractVersion:2,status:'contract_sent',__v:4,contractActivity:[]};
CompanyAuth.findById=()=>({select:async()=>({email:'client@example.test',companyId})});Company.findById=async()=>({_id:companyId});
Project.findOne=async filter=>{assert.equal(String(filter.companyId),companyId);return project;};
Project.updateOne=async(filter,update)=>{writes++;lastFilter=filter;const event=update.$push.contractActivity;if(event.event==='viewed'&&project.contractActivity.some(e=>e.event==='viewed'&&e.version===event.version&&e.by===event.by))return{modifiedCount:0};project.contractActivity.push(event);return{modifiedCount:1};};
const res={status(){return this;},json(){}};
async function invoke(body){let error;await c.recordClientContractActivity({params:{id:project._id},body,user:{sub:'client-id'}},res,e=>error=e);return error;}
(async()=>{
 assert.equal((await invoke({event:'changes_requested',version:2,note:'  '})).code,'CHANGE_REASON_REQUIRED');assert.equal(writes,0);
 assert.equal((await invoke({event:'viewed',version:1})).code,'CONTRACT_VERSION_CONFLICT');assert.equal(writes,0);
 assert.equal(await invoke({event:'viewed',version:2}),undefined);assert.ok(lastFilter.contractActivity.$not.$elemMatch);
 assert.equal(await invoke({event:'viewed',version:2}),undefined);assert.equal(project.contractActivity.length,1);
 assert.equal(await invoke({event:'changes_requested',version:2,note:'Please revise scope.'}),undefined);
 assert.equal(project.contractActivity.at(-1).note,'Please revise scope.');assert.equal(project.status,'contract_sent');
 project.status='active';assert.equal((await invoke({event:'changes_requested',version:2,note:'Change'})).code,'INVALID_PROJECT_STATUS');
 console.log('PASS: activity scoped to company and current version; viewed deduplicated; reason required; signed contracts protected. Mock DB only.');process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
