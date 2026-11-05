import { useId } from 'react';
export default function BridgeLogo({className}:{className?:string}){
 const filterId='bridge-logo-'+useId().replace(/:/g,'');
 return <svg className={className} viewBox="90 65 535 235" role="img" aria-label="Bridge" xmlns="http://www.w3.org/2000/svg"><defs><filter id={filterId} x="0" y="0" width="100%" height="100%"><feFlood floodColor="currentColor"/><feComposite in2="SourceAlpha" operator="in"/></filter></defs><image href="/dechub-assets/email/bridge-logo-email.png" x="0" y="0" width="688" height="363" filter={'url(#'+filterId+')'}/></svg>;
}
