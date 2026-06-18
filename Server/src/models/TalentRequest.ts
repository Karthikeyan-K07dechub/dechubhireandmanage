import mongoose, { Document, Schema } from 'mongoose';

export type TalentRequestStatus = 'new' | 'contacted' | 'in_discussion' | 'closed';

export interface ITalentRequest extends Document {
  _id: mongoose.Types.ObjectId;
  workerId: mongoose.Types.ObjectId;
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
  unread: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const talentRequestSchema = new Schema<ITalentRequest>(
  {
    workerId: { type: Schema.Types.ObjectId, ref: 'Worker', required: true, index: true },
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

    status: { type: String, enum: ['new', 'contacted', 'in_discussion', 'closed'], default: 'new' },
    unread: { type: Boolean, default: true },
  },
  { timestamps: true },
);

talentRequestSchema.index({ companyName: 1, createdAt: -1 });
talentRequestSchema.index({ unread: 1, createdAt: -1 });

export const TalentRequest = mongoose.model<ITalentRequest>('TalentRequest', talentRequestSchema);
