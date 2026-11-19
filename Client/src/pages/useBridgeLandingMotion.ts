import {useLayoutEffect,type RefObject} from 'react';

export default function useBridgeLandingMotion(root:RefObject<HTMLDivElement>){
 useLayoutEffect(()=>{
  const page=root.current;
  if(!page||!('IntersectionObserver' in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const nodes:Array<HTMLElement>=[];
  const add=(selector:string,direction:(index:number)=>string=()=> 'up',stagger=false)=>{
   page.querySelectorAll<HTMLElement>(selector).forEach((node,index)=>{
    node.classList.add('bl-reveal');node.dataset.reveal=direction(index);
    node.style.setProperty('--bl-reveal-delay',stagger?`${index%3*100}ms`:'0ms');
    nodes.push(node);
   });
  };
  add('.bl-hero > .bl-eyebrow, .bl-hero > h1, .bl-hero > .bl-lead',()=> 'up',true);
  add('.bl-capability-bar, .bl-section-heading, .bl-centered-actions, .bl-final > h2, .bl-final > p');
  add('.bl-two-grid > article, .bl-process > article',i=>i%2?'right':'left');
  add('.bl-control > div, .bl-talent > div',i=>i%2?'right':'left');
  add('.bl-feature-grid > article',i=>i%3===0?'left':i%3===2?'right':'up',true);
  add('.bl-faq > details',()=> 'up',true);
  const observer=new IntersectionObserver(entries=>{
   for(const entry of entries){
    const node=entry.target as HTMLElement;
    if(entry.isIntersecting)node.classList.add('bl-reveal-visible');
    else if(!node.contains(document.activeElement))node.classList.remove('bl-reveal-visible');
   }
  },{threshold:0,rootMargin:'0px 0px -35px 0px'});
  page.classList.add('bl-motion-enabled');
  nodes.forEach(node=>observer.observe(node));
  const revealFocused=(event:FocusEvent)=>{(event.target as HTMLElement).closest('.bl-reveal')?.classList.add('bl-reveal-visible');};
  page.addEventListener('focusin',revealFocused);
  return()=>{observer.disconnect();page.removeEventListener('focusin',revealFocused);page.classList.remove('bl-motion-enabled');nodes.forEach(node=>{node.classList.remove('bl-reveal','bl-reveal-visible');delete node.dataset.reveal;node.style.removeProperty('--bl-reveal-delay');});};
 },[root]);
}
