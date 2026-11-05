import { useState } from 'react';
import { api } from '../api/client';
import { contractorApi } from '../contractor/api/contractor.api';
import { documentError } from '../api/documents.api';
export default function TaskFileDownload({taskId,name,contractor=false}:{taskId:string;name?:string|null;contractor?:boolean}){
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');if(!name)return null;
 async function download(){if(busy)return;setBusy(true);setError('');try{const response=await(contractor?contractorApi:api).get((contractor?'':'/company')+'/project-tasks/'+taskId+'/attachment',{responseType:'blob'});const url=URL.createObjectURL(response.data);const link=document.createElement('a');link.href=url;link.download=name!;document.body.append(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),10000);}catch(error){setError(documentError(error));}finally{setBusy(false);}}
 return <div className="task-assignment-file"><span className="task-assignment-file-label">Document for task</span><button type="button" className="db-btn-secondary db-btn-sm" disabled={busy} onClick={()=>void download()} title={'Download '+name}>{busy?'Downloading...':name}</button>{error&&<small role="alert">{error}</small>}</div>;
}
