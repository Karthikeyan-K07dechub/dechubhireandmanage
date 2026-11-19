import {useLayoutEffect,type RefObject} from 'react';
import './home-scroll-reveal.css';

export default function useHomeScrollReveal(root:RefObject<HTMLDivElement>){
 useLayoutEffect(()=>{
  const page=root.current;
  if(!page||!('IntersectionObserver' in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const elements=new Set<HTMLElement>();
  const add=(selector:string,stagger=false)=>page.querySelectorAll<HTMLElement>(selector).forEach((element,index)=>{
   if(element.closest('.deel-clone-band--hero')||elements.has(element))return;
   elements.add(element);element.classList.add('bridge-home-reveal');
   element.style.setProperty('--home-reveal-delay',stagger?`${index%4*85}ms`:'0ms');
  });
  add('main h2, .deel-clone-band--metrics h3, .deel-clone-band--reviews h3');
  add('.deel-logo-strip__eyebrow, .deel-promo-stat__headline, .deel-speed-timeline');
  add('.deel-solution-card',true);
  add('.key-fig-container > div',true);
  add('.deel-clone-band--reviews .swiper-slide',true);
  const observer=new IntersectionObserver(entries=>{
   entries.forEach(entry=>{
    const element=entry.target as HTMLElement;
    if(entry.isIntersecting)element.classList.add('bridge-home-reveal--visible');
    else if(!element.contains(document.activeElement))element.classList.remove('bridge-home-reveal--visible');
   });
  },{threshold:0,rootMargin:'0px 0px -24px 0px'});
  page.classList.add('bridge-home-motion');elements.forEach(element=>observer.observe(element));
  const revealFocus=(event:FocusEvent)=>(event.target as HTMLElement).closest('.bridge-home-reveal')?.classList.add('bridge-home-reveal--visible');
  page.addEventListener('focusin',revealFocus);
  return()=>{observer.disconnect();page.removeEventListener('focusin',revealFocus);page.classList.remove('bridge-home-motion');elements.forEach(element=>{element.classList.remove('bridge-home-reveal','bridge-home-reveal--visible');element.style.removeProperty('--home-reveal-delay');});};
 },[root]);
}
