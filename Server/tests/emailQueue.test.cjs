const assert=require('node:assert/strict');process.chdir(require('node:path').join(__dirname,'..'));
const {EmailJob}=require('../dist/models/EmailJob');let jobs=[],sent=[],tracked=[],sequence=0;
EmailJob.create=async data=>{const job={...data,_id:String(++sequence),delivered:[],attempts:0,status:'queued',nextAt:new Date(),leaseUntil:null};jobs.push(job);return job};
EmailJob.findOneAndUpdate=async()=>{const job=jobs.filter(j=>j.status!=='sent'&&j.attempts<5&&j.nextAt<=Date.now()&&(!j.leaseUntil||j.leaseUntil<Date.now())).sort((a,b)=>b.priority-a.priority)[0];if(!job)return null;job.status='processing';job.leaseUntil=new Date(Date.now()+300000);return structuredClone(job);};
EmailJob.updateOne=async(q,u)=>{const j=jobs.find(j=>j._id===q._id);if(u.$addToSet&&!j.delivered.includes(u.$addToSet.delivered))j.delivered.push(u.$addToSet.delivered);Object.assign(j,u.$set||{});};
require('../dist/models/ITAccessRequest').ITAccessRequest.updateOne=async(q,u)=>tracked.push(u.$set.deliveryStatus);
let release;const gate=new Promise(resolve=>release=resolve);let fail=true;
require('../dist/utils/email').sendEmail=async(to)=>{if(to==='first@example.test')await gate;if(to==='second@example.test'&&fail)throw Error('Synthetic provider failure');sent.push(to);};require('../dist/utils/logger').logger.error=()=>{};
const {queueEmail,processEmailQueue}=require('../dist/services/emailQueue.service');
(async()=>{
 const start=Date.now();await queueEmail(['first@example.test','second@example.test','FIRST@example.test'],'Request','<p>Details</p>',{tracking:{kind:'it_request',recordId:'aaaaaaaaaaaaaaaaaaaaaaaa'}});assert(Date.now()-start<100,'Enqueue must not wait for SMTP');assert.equal(jobs[0].to.length,2);
 const processing=processEmailQueue();await new Promise(r=>setTimeout(r,30));assert.equal(sent.length,0,'Provider is deliberately blocked');assert.equal(jobs[0].status,'processing');
 release();await processing;assert.equal(jobs[0].status,'failed');assert.deepEqual(jobs[0].delivered,['first@example.test']);assert.equal(tracked.at(-1),'failed');
 fail=false;jobs[0].nextAt=new Date(0);await processEmailQueue();assert.deepEqual(sent,['first@example.test','second@example.test']);assert.equal(jobs[0].status,'sent');assert.equal(jobs[0].html,'');assert.equal(tracked.at(-1),'sent');
 await assert.rejects(()=>queueEmail([],'x','x'));
 console.log('PASS: durable enqueue returns while email is blocked, recipient deduplication, lease, retry, partial delivery progress, tracked request status and cleared delivered payload. Mock DB/email only.');process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
