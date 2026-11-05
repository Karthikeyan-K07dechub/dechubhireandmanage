import { useEffect, useRef } from 'react';
import type { ContractorNotification } from './types/contractor.types';
import { markContractorNotificationRead } from './api/contractor.api';
import './contractor-notification-popup.css';
export default function ContractorNotificationPopup({notifications,account,onRead,viewingNotifications=false}:{notifications:ContractorNotification[];account:string;onRead:(id:string)=>void;viewingNotifications?:boolean}) {
 const dialog=useRef<HTMLDialogElement>(null);const seen=useRef(new Set<string>());const accountRef=useRef('');
 useEffect(()=>{
  if(!account)return;
  const key='dechub_contractor_notifications_shown:'+account;
  if(accountRef.current!==account){accountRef.current=account;try{seen.current=new Set(JSON.parse(sessionStorage.getItem(key)||'[]'));}catch{seen.current=new Set();}}
  const fresh=notifications.some(item=>!item.readAt&&!seen.current.has(item._id));
  notifications.forEach(item=>seen.current.add(item._id));
  try{sessionStorage.setItem(key,JSON.stringify([...seen.current]));}catch{/* Keep in-memory popup state. */}
  if(fresh&&!viewingNotifications&&!dialog.current?.open)dialog.current?.showModal();
 },[notifications,account,viewingNotifications]);
 async function open(item:ContractorNotification){try{await markContractorNotificationRead(item._id);onRead(item._id);}catch{/* Navigation remains available if marking read fails. */}dialog.current?.close();window.location.assign(item.actionUrl?.startsWith('/contractor/dashboard?')?item.actionUrl:'/contractor/dashboard?tab=notifications');}
 const unread=notifications.filter(item=>!item.readAt);
 return <dialog ref={dialog} className="cnp-dialog" aria-labelledby="contractor-notification-heading"><header><div><h2 id="contractor-notification-heading">Notifications</h2><p>{unread.length} unread updates</p></div><button type="button" className="cnp-close" aria-label="Close notifications" onClick={()=>dialog.current?.close()}>{'\u00d7'}</button></header><div className="cnp-list">{unread.length?unread.map(item=><button type="button" className="cnp-item" key={item._id} onClick={()=>void open(item)}><strong>{item.title}</strong><span>{item.message}</span><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time><small>Open section</small></button>):<p>No unread notifications.</p>}</div></dialog>;
}
