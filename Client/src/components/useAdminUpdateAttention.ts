import {useEffect,useRef,useState} from 'react';
import {api} from '../api/client';
import {observeVisibleUpdates} from './updateVisibility';
type Item={resource:string;version:string;section:string};
export default function useAdminUpdateAttention(){const [items,setItems]=useState<Item[]>([]),pending=useRef(new Set<string>());
 useEffect(()=>{let active=true,running=false;const load=async()=>{if(running||document.hidden)return;running=true;try{const r=await api.get('/admin/update-attention');if(active)setItems(r.data.data);}catch{/* Keep last unread state until the next successful refresh. */}finally{running=false;}};void load();const timer=setInterval(()=>void load(),15000);const refresh=()=>void load();window.addEventListener('focus',refresh);window.addEventListener('admin-updates-read',refresh);return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',refresh);window.removeEventListener('admin-updates-read',refresh);};},[]);
 useEffect(()=>observeVisibleUpdates(el=>{const item=items.find(i=>i.resource===el.dataset.updateResource&&i.version===el.dataset.updateVersion);if(!item||pending.current.has(item.resource+item.version))return;const key=item.resource+item.version;pending.current.add(key);void api.post('/admin/update-attention/read',{items:[{id:item.resource.split(':')[1],version:item.version}]}).then(r=>{if(r.data.data.read)setItems(rows=>rows.filter(i=>i.resource!==item.resource||i.version!==item.version));}).catch(()=>{}).finally(()=>pending.current.delete(key));}),[items]);
 return items;
}
