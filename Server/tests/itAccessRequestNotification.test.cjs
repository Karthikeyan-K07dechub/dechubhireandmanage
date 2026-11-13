const assert=require('node:assert/strict');process.chdir(require('node:path').join(__dirname,'..'));
const id='aaaaaaaaaaaaaaaaaaaaaaaa',companyId='bbbbbbbbbbbbbbbbbbbbbbbb';
const {env}=require('../dist/config/env');env.DECHUB_ADMIN_EMAILS='admin@example.test';
require('../dist/models/Project').Project.findOne=async()=>({_id:id,companyId,title:'Support',status:'active',clientAcceptedAt:new Date(),contractorAcceptances:[{workerId:id}],teamMembers:[{workerId:id,role:'Developer'}]});
require('../dist/models/Worker').Worker.findById=async()=>({_id:id,firstName:'Alex',lastName:'Contractor',email:'contractor@example.test'});
let setting=null,failEmail=false,notifications=[],emails=[];
require('../dist/models/Company').Company.findById=async()=>({_id:companyId,ownerId:'owner',companyName:'Client',itManagement:setting});
require('../dist/models/CompanyAuth').CompanyAuth.findById=async()=>({firstName:'Client',email:'client@example.test'});
require('../dist/models/ITAccessRequest').ITAccessRequest.create=async()=>({_id:id});require('../dist/models/ITAccessRequest').ITAccessRequest.updateOne=async()=>{};
require('../dist/models/CompanyNotification').CompanyNotification.create=async n=>notifications.push(n);
require('../dist/services/emailQueue.service').queueEmail=async (to,subject,html,options)=>{if(failEmail)throw Error('Synthetic queue failure');emails.push(...to);assert.equal(options.tracking.kind,'it_request');};
require('../dist/utils/logger').logger.error=()=>{};
const {requestITAccess}=require('../dist/controllers/itAccessRequests.controller');
async function submit(){let error;await requestITAccess({worker:{sub:id},params:{id},body:{message:'Need repository access'}},{status(){return this},json(){}},e=>error=e);return error;}
(async()=>{assert.ifError(await submit());assert.equal(emails[0],'admin@example.test');assert.equal(notifications.length,1);assert.equal(notifications[0].companyId,companyId);assert(notifications[0].actionUrl.includes('tab=it-access&request='));setting='Yes';assert.ifError(await submit());assert.deepEqual(emails.slice(1).sort(),['admin@example.test','client@example.test']);assert.equal(notifications.length,2);failEmail=true;assert.equal((await submit()).code,'IT_REQUEST_EMAIL_FAILED');assert.equal(notifications.length,3,'Dashboard notification exists even if email fails');console.log('PASS: client dashboard notified for admin/client routing and before email failure, correct email recipients and chat deep link. No actual messages.');process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
