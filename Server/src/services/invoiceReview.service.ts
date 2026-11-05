import { downloadInvoiceDocument } from './invoiceStorage.service';
import { Invoice, IInvoice } from '../models/Invoice';
import { Company } from '../models/Company';
import { CompanyAuth } from '../models/CompanyAuth';
import { env } from '../config/env';
import { sendEmail } from '../utils/email';
import { buildInvoicePdf } from './invoicePdf.service';

export async function invoicePdf(invoice: IInvoice, client = false): Promise<Buffer> {
 const company = await Company.findById(invoice.companyId);
 const account = company ? await CompanyAuth.findById(company.ownerId) : null;
 return buildInvoicePdf(invoice, client, {name:company?.companyName||'Company details not provided',email:company?.billingEmail||account?.email,address:[company?.addressLine1,company?.addressCity,company?.companyCountry].filter(Boolean).join(', ')});
}
export async function clientInvoicePdf(invoice: IInvoice): Promise<Buffer> {
 return invoice.clientDocument ? downloadInvoiceDocument(invoice.clientDocument) : invoicePdf(invoice, true);
}
export async function notifyInvoiceAdmin(invoice: IInvoice): Promise<void> {
  try {
    const recipients = [...new Set(env.DECHUB_ADMIN_EMAILS.split(',').map(email => email.trim()).filter(Boolean))];
    if (!recipients.length) throw new Error('No invoice review admin email is configured.');
    await Promise.all(recipients.map(async to => sendEmail(to, 'Invoice for admin review: ' + invoice.invoiceNumber,
      '<p>A contractor invoice is awaiting your review. Verify it, add a service charge, and send it to the client.</p><p><a href="' + env.CLIENT_URL + '/admin/talent-requests#admin-invoice-review">Open admin invoice review</a></p>',
      { includeLogo: false, attachments: [{ filename: invoice.invoiceNumber + '.pdf', content: await invoicePdf(invoice), contentType: 'application/pdf' }] })));
    await Invoice.updateOne({ _id: invoice._id }, { $set: { adminEmailSentAt: new Date(), adminEmailError: null } });
  } catch (error) {
    await Invoice.updateOne({ _id: invoice._id }, { $set: { adminEmailError: 'Admin email delivery failed. Retry from Invoice review.' } });
    throw error;
  }
}
export async function notifyInvoiceClient(invoice: IInvoice): Promise<void> {
  try {
    const company = await Company.findById(invoice.companyId);
    const account = company ? await CompanyAuth.findById(company.ownerId) : null;
    const recipient = company?.billingEmail || account?.email;
    if (!recipient) throw new Error('Client billing email is unavailable.');
    await sendEmail(recipient, 'Invoice ready for review: ' + invoice.invoiceNumber,
      '<p>Dechub has reviewed your invoice. Review the total and approve or dispute it. The invoice document is attached.</p><p><a href="' + env.CLIENT_URL + '/dashboard?tab=invoices">Open invoices</a></p>',
      { includeLogo: false, attachments: [{ filename: invoice.clientDocument?.fileName || invoice.invoiceNumber + '.pdf', content: await clientInvoicePdf(invoice), contentType: invoice.clientDocument?.mimeType || 'application/pdf' }] });
    await Invoice.updateOne({ _id: invoice._id }, { $set: { clientEmailSentAt: new Date(), clientEmailError: null } });
  } catch (error) {
    await Invoice.updateOne({ _id: invoice._id }, { $set: { clientEmailError: 'Client email delivery failed. Retry from Invoice review.' } });
    throw error;
  }
}
