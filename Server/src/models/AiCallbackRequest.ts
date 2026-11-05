import mongoose, { Document, Schema } from 'mongoose';

export interface IAiCallbackRequest extends Document {
  _id: mongoose.Types.ObjectId;
  requestId: string;
  contactName: string;
  workEmail: string;
  phone: string;
  question: string;
  questionNormalized: string;
  channel: 'chat' | 'voice';
  conversationId: string;
  consentContact: boolean;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

const aiCallbackRequestSchema = new Schema<IAiCallbackRequest>(
  {
    requestId: { type: String, required: true, unique: true, index: true },
    contactName: { type: String, required: true, trim: true },
    workEmail: { type: String, required: true, trim: true, lowercase: true, index: true },
    phone: { type: String, default: '', trim: true },
    question: { type: String, required: true, trim: true },
    questionNormalized: { type: String, required: true, trim: true, index: true },
    channel: { type: String, enum: ['chat', 'voice'], default: 'chat' },
    conversationId: { type: String, default: '', index: true },
    consentContact: { type: Boolean, required: true },
    source: { type: String, default: 'ai_assistant' },
  },
  { timestamps: true },
);

aiCallbackRequestSchema.index({ source: 1, workEmail: 1, questionNormalized: 1, createdAt: -1 });
aiCallbackRequestSchema.index({ conversationId: 1 });

export const AiCallbackRequest = mongoose.model<IAiCallbackRequest>('AiCallbackRequest', aiCallbackRequestSchema);
