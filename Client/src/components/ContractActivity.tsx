import './contract-activity.css';
export interface ContractActivityItem {event:'sent'|'viewed'|'changes_requested'|'revised'|'accepted';version:number;at:string;by:string;note?:string;}
const labels={sent:'Contract sent',viewed:'Viewed by client',changes_requested:'Changes requested',revised:'Contract revised',accepted:'Contract accepted'};
export default function ContractActivity({items}:{items:ContractActivityItem[]}){
 return <section className="contract-activity"><h3>Activity history</h3>{!items.length?<p>No activity recorded yet.</p>:<ol>{[...items].reverse().map((item,index)=><li key={item.at+item.event+index} className={'contract-activity-'+item.event}><span className="contract-activity-marker"/><div><strong>{labels[item.event]}</strong><span className="contract-activity-version">Version {item.version}</span><small>{item.by} · {new Date(item.at).toLocaleString()}</small>{item.note&&<p>{item.note}</p>}</div></li>)}</ol>}</section>;
}
