import {useId,useRef,useState} from 'react';
import ITAccessPanel from '../components/ITAccessPanel';
import './request-it-access.css';
export default function RequestITAccessButton({projectId,projectTitle,disabled=false}:{projectId:string;projectTitle:string;disabled?:boolean}){
 const dialog=useRef<HTMLDialogElement>(null),title=useId();const [open,setOpen]=useState(false);
 return <><button type="button" className="ctp-request-it-button" onClick={()=>{setOpen(true);dialog.current?.showModal();}}>IT access &amp; chat</button><dialog ref={dialog} className="it-access-dialog it-access-chat-dialog" aria-labelledby={title} onClose={()=>setOpen(false)}><header><h2 id={title}>{projectTitle}</h2><button type="button" onClick={()=>dialog.current?.close()}>Close</button></header>{open&&<ITAccessPanel key={projectId} contractor projectId={projectId} canCreate={!disabled}/>}</dialog></>;
}
