// Offline merge regression: no real database, storage, accounts or messages.
const assert=require('node:assert/strict');
process.chdir(require('node:path').join(__dirname,'..'));
const {env}=require('../dist/config/env');
const {Worker}=require('../dist/models/Worker');
const {AiTalentSearch}=require('../dist/models/AiTalentSearch');
const {searchAiTalent}=require('../dist/controllers/aiVisitor.controller');
const {requireAiToolSecret}=require('../dist/middleware/aiTool.middleware');
const makeWorker=(id,title,skills,extra={})=>({_id:id,firstName:'Alex',lastName:'Example',workerType:'contractor',status:'active',kycStatus:'approved',kycData:{idFrontPath:'private/document'},country:'India',contractorProfile:{marketplaceTitle:title,marketplaceBio:'Experienced specialist building production software.',marketplaceRate:30,city:'Chennai',skills,servicePackages:[{price:100}]},...extra});
let workers=[],stored=[];
Worker.find=()=>({sort(){return this},lean:async()=>workers});
AiTalentSearch.create=async value=>{stored.push(value);return value};
async function search(body){let status,result;await searchAiTalent({body},{status(v){status=v;return this},json(v){result=v}});return {status,...result};}
(async()=>{
 env.AI_TALENT_REQUIRE_VERIFIED='true';
 workers=[makeWorker('one','React developer',['React']),makeWorker('two','React developer',['React'],{kycStatus:'pending'}),makeWorker('three','React developer',['React'],{status:'terminated'})];
 let result=await search({role:'React developer',skills:['React']});assert.equal(result.match_type,'exact');assert.equal(result.matches.length,1);assert(!JSON.stringify(result).includes('private/document'));assert(!JSON.stringify(result).includes('kycStatus'));assert.equal(stored[0].workerIds.length,1);
 workers=[makeWorker('one','Frontend engineer',['React'])];result=await search({role:'React developer',skills:['React']});assert.equal(result.match_type,'closest');
 result=await search({role:'Accountant',skills:['Bookkeeping']});assert.equal(result.match_type,'none');
 result=await search({role:''});assert.equal(result.status,400);
 env.AI_TOOL_SECRET='local-test-only';let authorized=false,status;
 const res={status(v){status=v;return this},json(){}};
 requireAiToolSecret({header:()=> 'wrong'},res,()=>authorized=true);assert.equal(status,401);assert.equal(authorized,false);
 requireAiToolSecret({header:()=> 'local-test-only'},res,()=>authorized=true);assert.equal(authorized,true);
 console.log('PASS: AI exact/closest/no-match searches, verified KYC filter, terminated exclusion, response privacy, input validation and shared-secret authentication. Offline mocks only.');
 process.exit(0);
})().catch(error=>{console.error(error);process.exit(1)});
