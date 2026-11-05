import mongoose, { Schema } from 'mongoose';
import type { InvoiceDocument } from '../services/invoiceStorage.service';

interface IProjectDocument {
  companyId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  file: InvoiceDocument;
  uploadedBy: string;
  status: 'available' | 'replacement_requested';
  replacementReason: string;
  createdAt: Date;
}
const schema = new Schema<IProjectDocument>({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  file: { type: new Schema({ bucket: String, path: String, fileName: String, size: Number, sha256: String }, { _id: false }), required: true },
  uploadedBy: { type: String, required: true },
  status: { type: String, enum: ['available', 'replacement_requested'], default: 'available' },
  replacementReason: { type: String, default: '' },
}, { timestamps: true });
export const ProjectDocument = mongoose.model<IProjectDocument>('ProjectDocument', schema);
