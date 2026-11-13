import {createHash} from 'crypto';
export const DEMO_HOST={name:'Prasanna',email:'prasanna@dechub.in'};
export const DEMO_DURATION=30;
export const hashBookingToken=(token:string)=>createHash('sha256').update(token).digest('hex');
export function validDemoSlot(date:Date,now=new Date()){
 const local=new Date(date.getTime()+330*60000);
 const minute=local.getUTCHours()*60+local.getUTCMinutes();
 return Number.isFinite(date.getTime())&&date.getTime()>=now.getTime()+60*60000&&date.getTime()<=now.getTime()+90*86400000&&local.getUTCDay()>0&&local.getUTCDay()<6&&minute>=9*60&&minute<=18*60+30&&local.getUTCMinutes()%30===0&&local.getUTCSeconds()===0&&local.getUTCMilliseconds()===0;
}
const icsEscape=(value:string)=>value.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
const stamp=(date:Date)=>date.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
export function demoCalendar(booking:any){
 const end=new Date(new Date(booking.startAt).getTime()+DEMO_DURATION*60000);
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Bridge//Demo bookings//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT','UID:'+booking._id+'@dechub.ai','DTSTAMP:'+stamp(new Date()),'DTSTART:'+stamp(new Date(booking.startAt)),'DTEND:'+stamp(end),'SEQUENCE:'+(booking.sequence||0),'STATUS:'+(booking.status==='cancelled'?'CANCELLED':'CONFIRMED'),'SUMMARY:'+icsEscape(booking.firstName+' x Prasanna | Bridge Demo'),'DESCRIPTION:'+icsEscape('A 30-minute Bridge walkthrough with Prasanna. Prasanna will share the online meeting joining details by email. Contact: '+DEMO_HOST.email),'LOCATION:Online - joining details from Prasanna','ORGANIZER;CN=Prasanna:mailto:'+DEMO_HOST.email,'ATTENDEE;CN='+icsEscape(booking.firstName+' '+booking.lastName)+':mailto:'+booking.email,'END:VEVENT','END:VCALENDAR'];
 // Fold long content lines without splitting a UTF-8 code point.
 return lines.map(line=>{let out='',current='';for(const character of line){if(Buffer.byteLength(current+character)>73){out+=current+'\r\n';current=' ';}current+=character;}return out+current;}).join('\r\n')+'\r\n';
}
