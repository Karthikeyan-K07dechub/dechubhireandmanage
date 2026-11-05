import type { InvoiceDocument } from '../services/invoiceStorage.service';
import mongoose, { Document, Schema } from 'mongoose';

export type InvoiceStatus = 'pending_admin' | 'draft' | 'submitted' | 'approved' | 'paid' | 'disputed';

export interface IInvoice extends Document {
  adminReviewStatus: 'pending' | 'approved' | 'changes_requested';
  adminReviewReason: string | null;
  adminReviewedAt: Date | null;
  _id:           mongoose.Types.ObjectId;
  companyId:     mongoose.Types.ObjectId;
  workerId:      mongoose.Types.ObjectId;
  contractId:    mongoose.Types.ObjectId | null;
  projectId: mongoose.Types.ObjectId | null;
  workerName:    string;
  workerRole:    string;
  invoiceNumber: string;
  periodStart:   Date;
  periodEnd:     Date;
  amountGross:   number;
  currency:      string;
  description:   string;
  projectName:   string;
  serviceCharge: number;
  clientTotal: number | null;
  clientSentAt: Date | null;
  clientDocument: InvoiceDocument | null;
  adminReviewedBy: string | null;
  adminEmailSentAt: Date | null;
  adminEmailError: string | null;
  clientEmailSentAt: Date | null;
  clientEmailError: string | null;
  hoursWorked:   number | null;
  status:        InvoiceStatus;
  submittedAt:   Date;
  approvedAt:    Date | null;
  approvedBy:    mongoose.Types.ObjectId | null;
  paidAt:        Date | null;
  wiseTransferId:string | null;
  pdfUrl:        string | null;
  disputeReason: string | null;
  createdAt:     Date;
  updatedAt:     Date;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    adminReviewStatus: { type: String, enum: ['pending','approved','changes_requested'], default: 'pending' },
    adminReviewReason: { type: String, default: null },
    adminReviewedAt: { type: Date, default: null },
    companyId:      { type: Schema.Types.ObjectId, ref: 'Company',  required: true, index: true },
    workerId:       { type: Schema.Types.ObjectId, ref: 'Worker',   required: true, index: true },
    contractId:     { type: Schema.Types.ObjectId, ref: 'Contract', default: null },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', default: null, index: true },
    workerName:     { type: String, required: true },
    workerRole:     { type: String, required: true },
    invoiceNumber:  { type: String, required: true, unique: true },
    periodStart:    { type: Date, required: true },
    periodEnd:      { type: Date, required: true },
    amountGross:    { type: Number, required: true, min: 0 },
    currency:       { type: String, default: 'USD' },
    description:    { type: String, required: true },
    projectName:    { type: String, trim: true, maxlength: 180, default: '' },
    serviceCharge: { type: Number, min: 0, default: 0 },
    clientTotal: { type: Number, min: 0, default: null },
    clientDocument: { type: new Schema({ bucket: String, path: String, fileName: String, mimeType: String, size: Number, sha256: String }, { _id: false }), default: null },
    clientSentAt: { type: Date, default: null },
    adminReviewedBy: { type: String, default: null },
    adminEmailSentAt: { type: Date, default: null },
    adminEmailError: { type: String, default: null },
    clientEmailSentAt: { type: Date, default: null },
    clientEmailError: { type: String, default: null },
    hoursWorked:    { type: Number, default: null },
    status:         { type: String, enum: ['pending_admin','draft','submitted','approved','paid','disputed'], default: 'submitted' },
    submittedAt:    { type: Date, default: Date.now },
    approvedAt:     { type: Date, default: null },
    approvedBy:     { type: Schema.Types.ObjectId, ref: 'User', default: null },
    paidAt:         { type: Date, default: null },
    wiseTransferId: { type: String, default: null },
    pdfUrl:         { type: String, default: null },
    disputeReason:  { type: String, default: null },
  },
  { timestamps: true },
);

invoiceSchema.index({ companyId: 1, status: 1 });
invoiceSchema.index({ workerId: 1, periodStart: 1 });

// ─── Auto-generate invoice number ─────────────────────────────────────────────

invoiceSchema.pre('validate', function (next) {
  if (this.isNew && !this.invoiceNumber) {
    this.invoiceNumber = `INV-${new Date().getFullYear()}-${this._id.toString().toUpperCase()}`;
  }
  next();
});

export const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema);
