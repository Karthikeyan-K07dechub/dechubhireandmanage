const assert=require('node:assert/strict');process.chdir(require('node:path').join(__dirname,'..'));
const {ITAccessRequest}=require('../dist/models/ITAccessRequest');
const {env}=require('../dist/config/env');env.DECHUB_ADMIN_EMAILS='admin1@example.test,admin2@example.test,ADMIN1@example.test';
require('../dist/models/Project').Project.findById=async()=>({title:'Website <support>'});
require('../dist/models/Company').Company.findById=async()=>({companyName:'Client & Co'});
require('../dist/models/Worker').Worker.findById=async()=>({firstName:'Alex',lastName:'Contractor',email:'contractor@example.test'});
let entry={_id:'entry',sender:'client',name:'client@example.test',text:'Invitation sent <script>',status:'granted',previousStatus:'in_progress',createdAt:new Date(),adminEmailNextAt:new Date(),adminEmailAttempts:0,adminEmailDelivered:[]};
const request={_id:'request',projectId:'project',companyId:'company',workerId:'worker',message:'Need repository <access>',entries:[entry]};
let available=true,sent=[],failure=true;
ITAccessRequest.findOneAndUpdate=async()=>{if(!available)return null;available=false;return request};
ITAccessRequest.updateOne=async(q,u)=>{assert.equal(q['entries._id'],'entry');if(u.$addToSet)entry.adminEmailDelivered.push(u.$addToSet['entries.$.adminEmailDelivered']);if(u.$set)for(const [key,value]of Object.entries(u.$set))entry[key.split('.').at(-1)]=value;};
require('../dist/utils/email').sendEmail=async(to,subject,html)=>{if(to==='admin2@example.test'&&failure)throw Error('Synthetic SMTP outage');sent.push({to,subject,html})};require('../dist/utils/logger').logger.error=()=>{};
const {processITAccessAdminEmails}=require('../dist/services/itAccessAdminEmail.service');
(async()=>{
 await processITAccessAdminEmails();assert.equal(sent.length,1);assert.equal(entry.adminEmailAttempts,1);assert(entry.adminEmailNextAt>Date.now());
 assert(sent[0].subject.includes('Client replied and updated status'));assert(sent[0].html.includes('Need repository &lt;access&gt;'));assert(sent[0].html.includes('Invitation sent &lt;script&gt;'));assert(sent[0].html.includes('in progress'));assert(sent[0].html.includes('granted'));assert(!sent[0].html.includes('<script>'));
 failure=false;available=true;entry.adminEmailNextAt=new Date(0);await processITAccessAdminEmails();assert.deepEqual(sent.map(e=>e.to),['admin1@example.test','admin2@example.test']);assert.equal(entry.adminEmailNextAt,null);
 for(const sender of ['client','contractor']){available=true;entry={...entry,sender,status:undefined,text:'Message reply',adminEmailNextAt:new Date(0),adminEmailAttempts:0,adminEmailDelivered:[]};request.entries=[entry];await processITAccessAdminEmails();assert(sent.at(-1).subject.includes(sender==='client'?'Client replied':'Contractor replied'));}
 console.log('PASS: admin recipients/deduplication, original request, client/contractor replies, previous/new status, escaped content and persistent partial-recipient retry. No real email.');process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
