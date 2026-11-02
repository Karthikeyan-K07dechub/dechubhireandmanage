import { downloadInvoiceDocument } from './invoiceStorage.service';
import { Invoice, IInvoice } from '../models/Invoice';
import { Company } from '../models/Company';
import { CompanyAuth } from '../models/CompanyAuth';
import { env } from '../config/env';
import { sendEmail } from '../utils/email';
import { buildPdfBuffer, wrapText } from './contractPdf.service';

export function invoicePdf(invoice: IInvoice, client = false): Buffer {
  const date = (value: Date) => new Date(value).toISOString().slice(0, 10);
  return buildPdfBuffer([
    'Dechub Bridge - Invoice', 'Invoice: ' + invoice.invoiceNumber,
    ...wrapText('Project: ' + (invoice.projectName || 'Not provided')),
    ...wrapText('Contractor: ' + invoice.workerName), ...wrapText('Role: ' + invoice.workerRole),
    'Period: ' + date(invoice.periodStart) + ' to ' + date(invoice.periodEnd),
    'Status: ' + invoice.status.replace(/_/g, ' '), '', 'Work description:', ...wrapText(invoice.description), '',
    'Contractor amount: ' + invoice.currency + ' ' + invoice.amountGross.toFixed(2),
    ...(client ? ['Service charge: ' + invoice.currency + ' ' + invoice.serviceCharge.toFixed(2), 'Total due: ' + invoice.currency + ' ' + (invoice.clientTotal ?? invoice.amountGross).toFixed(2)] : []),
  ]);
}
export async function clientInvoicePdf(invoice: IInvoice): Promise<Buffer> {
 return invoice.clientDocument ? downloadInvoiceDocument(invoice.clientDocument) : invoicePdf(invoice, true);
}
export async function notifyInvoiceAdmin(invoice: IInvoice): Promise<void> {
  try {
    const recipients = [...new Set(env.DECHUB_ADMIN_EMAILS.split(',').map(email => email.trim()).filter(Boolean))];
    if (!recipients.length) throw new Error('No invoice review admin email is configured.');
    await Promise.all(recipients.map(to => sendEmail(to, 'Invoice for admin review: ' + invoice.invoiceNumber,
      '<p>A contractor invoice is awaiting your review. Verify it, add a service charge, and send it to the client.</p><p><a href="' + env.CLIENT_URL + '/admin/talent-requests#admin-invoice-review">Open admin invoice review</a></p>',
      { includeLogo: false, attachments: [{ filename: invoice.invoiceNumber + '.pdf', content: invoicePdf(invoice), contentType: 'application/pdf' }] })));
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
      '<p>Dechub has reviewed your invoice. Review the total and approve or dispute it. The PDF is attached.</p><p><a href="' + env.CLIENT_URL + '/dashboard?tab=invoices">Open invoices</a></p>',
      { includeLogo: false, attachments: [{ filename: invoice.invoiceNumber + '.pdf', content: await clientInvoicePdf(invoice), contentType: 'application/pdf' }] });
    await Invoice.updateOne({ _id: invoice._id }, { $set: { clientEmailSentAt: new Date(), clientEmailError: null } });
  } catch (error) {
    await Invoice.updateOne({ _id: invoice._id }, { $set: { clientEmailError: 'Client email delivery failed. Retry from Invoice review.' } });
    throw error;
  }
}
