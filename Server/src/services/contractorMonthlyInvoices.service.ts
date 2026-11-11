import {AppError} from '../utils/response';
export function contractorBillingPeriod(month:string,now=new Date()){
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw new AppError('Choose a valid billing month.',422,'INVALID_BILLING_MONTH');
 const [year,m]=month.split('-').map(Number);const start=new Date(Date.UTC(year,m-1,1)-330*60000),endExclusive=new Date(Date.UTC(year,m,1)-330*60000);
 if(year<2000||year>2199||start>now)throw new AppError('Future billing months cannot be invoiced.',422,'INVALID_BILLING_MONTH');
 return {start,endExclusive,end:new Date(endExclusive.getTime()-1)};
}
