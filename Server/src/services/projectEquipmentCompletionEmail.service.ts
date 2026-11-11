import {EquipmentRequest} from '../models/EquipmentRequest';
import {sendEmail} from '../utils/email';
import {env} from '../config/env';
import {escapeMessageHtml as esc} from './messageAlerts.service';

export async function sendProjectEquipmentCompletionEmail(project:{_id:unknown;title:string},company:{companyName?:string|null}){
 const equipment=await EquipmentRequest.find({projectId:project._id,deliveryStatus:{$in:['delivered','ready_to_return']}}).select('contractorName contractorEmail equipmentType otherEquipment deliveryStatus');
 const root=env.CLIENT_URL.replace(/\/$/,'');
 const rows=equipment.map(item=>'<tr><td style="padding:8px">'+esc(item.contractorName)+'</td><td style="padding:8px">'+esc(item.contractorEmail)+'</td><td style="padding:8px">'+esc(item.otherEquipment||item.equipmentType)+'</td><td style="padding:8px">'+(item.deliveryStatus==='ready_to_return'?'Return already requested':'Please request equipment return')+'</td><td style="padding:8px"><a href="'+esc(root+'/admin/talent-requests?equipment='+item._id)+'">View equipment request</a></td></tr>').join('');
 const html='<h2>Project completed'+(equipment.length?' - equipment return required':'')+'</h2><p>Hello Admin,</p><p>The client has marked the project as completed.</p><p><strong>Project:</strong> '+esc(project.title)+'<br/><strong>Company:</strong> '+esc(company.companyName||'Not provided')+'</p>'+(equipment.length?'<p>Please request the return of the equipment below, or follow up on existing return requests. Arrange collection with each contractor.</p><table><tr><th>Contractor</th><th>Email</th><th>Equipment</th><th>Next action</th><th>View</th></tr>'+rows+'</table>':'<p>No delivered equipment is currently awaiting return for this project.</p>')+'<p>Thank you,<br/>Bridge equipment management</p>';
 const recipients=[...new Set(env.DECHUB_ADMIN_EMAILS.split(',').map(email=>email.trim()).filter(Boolean))];
 if(!recipients.length)throw Error('Admin email is not configured');
 await Promise.all(recipients.map(to=>sendEmail(to,'Project completed'+(equipment.length?' - request equipment return':'')+': '+project.title,html)));
}
