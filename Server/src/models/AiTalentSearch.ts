import mongoose, { Document, Schema } from 'mongoose';

export type AiTalentMatchType = 'exact' | 'closest' | 'none';

export interface IAiTalentSearch extends Document {
  searchId: string;
  conversationId: string;
  role: string;
  skills: string[];
  level: string;
  matchType: AiTalentMatchType;
  workerIds: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const aiTalentSearchSchema = new Schema<IAiTalentSearch>(
  {
    searchId: { type: String, required: true, unique: true, trim: true },
    conversationId: { type: String, default: '', index: true, trim: true },
    role: { type: String, required: true, trim: true, maxlength: 100 },
    skills: { type: [String], default: [] },
    level: { type: String, default: '', trim: true, maxlength: 50 },
    matchType: { type: String, enum: ['exact', 'closest', 'none'], required: true },
    workerIds: [{ type: Schema.Types.ObjectId, ref: 'Worker' }],
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'ai_talent_searches' },
);

aiTalentSearchSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
aiTalentSearchSchema.index({ conversationId: 1, createdAt: -1 });

export const AiTalentSearch = mongoose.model<IAiTalentSearch>('AiTalentSearch', aiTalentSearchSchema);
