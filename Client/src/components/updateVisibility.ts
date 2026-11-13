// Reading one project must never clear updates for other projects in the section.
export function updateResource(href:string,origin=window.location.origin):string|null {
 try{const u=new URL(href,origin),p=u.searchParams;
  if(p.get('update'))return 'update:'+p.get('update');
  if(p.get('requestContract'))return 'request-contract:'+p.get('requestContract');
  if(p.get('task'))return 'task:'+p.get('task');
  if(p.get('request'))return (p.get('tab')==='it-access'||p.get('itAccess')?'it-access:':'equipment:')+p.get('request');
  if(p.get('updates'))return 'project-updates:'+p.get('updates');
  if(p.get('project')&&(p.get('chatPeer')||p.get('chatWorker')))return 'peer:'+p.get('project')+':'+(p.get('chatPeer')||p.get('chatWorker'));
  if(p.get('tab')==='profile')return 'section:profile';
  if(p.get('project'))return 'project:'+p.get('project');
  const hash=u.hash.match(/(?:project-contract|talent-request|document)-(.+)/);if(hash)return (u.hash.startsWith('#talent-request')?'request:':u.hash.startsWith('#document')?'document:':'project:')+hash[1];
 }catch{/* A malformed action URL cannot mark anything as read. */}return null;
}
export function observeVisibleUpdates(onVisible:(element:HTMLElement)=>void,selector='[data-update-resource],[data-update-notice]'){
 const timers=new Map<Element,ReturnType<typeof setTimeout>>(),observed=new WeakSet<Element>();let stopped=false;
 const actuallyVisible=(element:HTMLElement)=>{if(document.hidden||!element.isConnected)return false;const rect=element.getBoundingClientRect();if(rect.width<=0||rect.height<=0||rect.bottom<=0||rect.top>=innerHeight)return false;const modals=Array.from(document.querySelectorAll<HTMLElement>('dialog[open],[role="dialog"][aria-modal="true"]')).filter(el=>el.getBoundingClientRect().height>0);const top=modals[modals.length-1];return !top||top.contains(element);};
 const observer=new IntersectionObserver(entries=>{for(const entry of entries){const pending=timers.get(entry.target);if(pending)clearTimeout(pending);timers.delete(entry.target);if(entry.isIntersecting&&entry.intersectionRatio>=.4){timers.set(entry.target,setTimeout(()=>{timers.delete(entry.target);if(!stopped&&actuallyVisible(entry.target as HTMLElement))onVisible(entry.target as HTMLElement);},650));}}},{threshold:[0,.4,.8]});
 const scan=()=>document.querySelectorAll(selector).forEach(el=>{if(!observed.has(el)){observed.add(el);observer.observe(el);}});scan();const changes=new MutationObserver(()=>{scan();focus();});changes.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open','data-update-resource','data-update-notice','data-update-version']});const focus=()=>{observer.disconnect();document.querySelectorAll(selector).forEach(el=>observer.observe(el));};document.addEventListener('visibilitychange',focus);window.addEventListener('focus',focus);
 return()=>{stopped=true;observer.disconnect();changes.disconnect();timers.forEach(clearTimeout);document.removeEventListener('visibilitychange',focus);window.removeEventListener('focus',focus);};
}
