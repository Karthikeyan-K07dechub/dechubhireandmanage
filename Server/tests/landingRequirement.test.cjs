const assert=require('node:assert/strict');process.chdir(require('node:path').join(__dirname,'..'));
const {TalentRequest}=require('../dist/models/TalentRequest'),{CompanyAuth}=require('../dist/models/CompanyAuth');
const email=require('../dist/utils/email');let saved=[],emails=[];
email.sendTalentRequestAdminNotificationEmail=async(to,input)=>emails.push(input);
CompanyAuth.findOne=()=>({select:async()=>null});
TalentRequest.create=async data=>{saved.push(data);return{...data,_id:'aaaaaaaaaaaaaaaaaaaaaaaa'};};
const {createLandingRequirement}=require('../dist/controllers/landingRequirement.controller');
async function invoke(body){let error,response;await createLandingRequirement({body},{status(){return this;},json(value){response=value;}},e=>error=e);return{error,response};}
(async()=>{
 const input={requirement:'Build a customer portal',email:'hello@example.test',phone:'+971 50 123 4567',companyName:'Example company'};
 assert((await invoke({...input,email:'test@gmail.com'})).error);assert.equal(saved.length,0);
 assert((await invoke({...input,requirement:' '})).error);assert((await invoke({...input,phone:'123'})).error);assert.equal(saved.length,0);
 const result=await invoke(input);assert.ifError(result.error);assert.equal(saved.length,1);assert.equal(emails.length,1);
 assert.equal(saved[0].projectDescription,input.requirement);assert.equal(saved[0].companyName,input.companyName);assert.equal(saved[0].source,'Bridge landing page');assert.equal(saved[0].companyId,null);
 assert.equal(saved[0].expectedStartDate,undefined);assert.equal(saved[0].projectStage,undefined);
 assert.equal(emails[0].contactEmail,input.email);assert.match(result.response.data.message,/Bridge team will contact/);
 console.log('PASS: inline lead requires only brief/work email/phone/company; rejects invalid input; saves pending request and queues admin details without fabricated dates/project choices. Mock DB/email only.');process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
