import mongoose, { Document, Schema } from 'mongoose';

export type TalentRequestStatus =
  | 'pending_review'
  | 'approved'
  | 'alternative_suggested'
  | 'rejected'
  | 'hired';

export interface ITalentRequest extends Document {
  _id: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  workerId: mongoose.Types.ObjectId;
  originalWorkerId: mongoose.Types.ObjectId | null;
  suggestedWorkerId: mongoose.Types.ObjectId | null;
  workerName: string;
  workerRole: string;
  workerProfileUrl?: string;
  companyName: string;
  companyWebsite: string;
  contactFirstName: string;
  contactLastName: string;
  phoneNumber: string;
  email: string;
  projectType: string;
  budget: string;
  projectDescription: string;
  status: TalentRequestStatus;
  reviewNotes: string;
  approvedAt: Date | null;
  reviewedAt: Date | null;
  hiredAt: Date | null;
  unread: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const talentRequestSchema = new Schema<ITalentRequest>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    workerId: { type: Schema.Types.ObjectId, ref: 'Worker', required: true, index: true },
    originalWorkerId: { type: Schema.Types.ObjectId, ref: 'Worker', default: null },
    suggestedWorkerId: { type: Schema.Types.ObjectId, ref: 'Worker', default: null },
    workerName: { type: String, required: true, trim: true },
    workerRole: { type: String, required: true, trim: true },
    workerProfileUrl: { type: String, default: '' },

    companyName: { type: String, required: true, trim: true },
    companyWebsite: { type: String, default: '', trim: true },
    contactFirstName: { type: String, required: true, trim: true },
    contactLastName: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },

    projectType: { type: String, required: true, trim: true },
    budget: { type: String, required: true, trim: true },
    projectDescription: { type: String, required: true, trim: true },

    status: {
      type: String,
      enum: ['pending_review', 'approved', 'alternative_suggested', 'rejected', 'hired'],
      default: 'pending_review',
    },
    reviewNotes: { type: String, default: '', trim: true },
    approvedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    hiredAt: { type: Date, default: null },
    unread: { type: Boolean, default: true },
  },
  { timestamps: true },
);

talentRequestSchema.index({ companyName: 1, createdAt: -1 });
talentRequestSchema.index({ unread: 1, createdAt: -1 });
talentRequestSchema.index({ companyId: 1, createdAt: -1 });

export const TalentRequest = mongoose.model<ITalentRequest>('TalentRequest', talentRequestSchema);
