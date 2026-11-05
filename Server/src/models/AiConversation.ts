import mongoose, { Document, Schema } from 'mongoose';

export interface IAiConversation extends Document {
  conversationId: string;
  agentId: string;
  agentName: string;
  channel: 'chat' | 'voice' | 'unknown';
  startedAt: Date | null;
  durationSecs: number;
  status: string;
  transcript: Array<{ role: string; message: string; timeInCallSecs: number }>;
  summary: string;
  callSuccessful: string;
  dataCollection: Record<string, string>;
  evaluation: Record<string, { result: string; rationale: string }>;
  requestId?: string;
  consentContact: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const transcriptSchema = new Schema(
  { role: { type: String, default: '' }, message: { type: String, default: '' }, timeInCallSecs: { type: Number, default: 0 } },
  { _id: false },
);

const aiConversationSchema = new Schema<IAiConversation>(
  {
    conversationId: { type: String, required: true, unique: true, index: true },
    agentId: { type: String, default: '' },
    agentName: { type: String, default: 'bridge_visitor' },
    channel: { type: String, enum: ['chat', 'voice', 'unknown'], default: 'unknown' },
    startedAt: { type: Date, default: null },
    durationSecs: { type: Number, default: 0 },
    status: { type: String, default: '' },
    transcript: { type: [transcriptSchema], default: [] },
    summary: { type: String, default: '' },
    callSuccessful: { type: String, default: 'unknown' },
    dataCollection: { type: Schema.Types.Mixed, default: {} },
    evaluation: { type: Schema.Types.Mixed, default: {} },
    requestId: { type: String, default: '' },
    consentContact: { type: Boolean, default: false },
  },
  { timestamps: true },
);

aiConversationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

export const AiConversation = mongoose.model<IAiConversation>('AiConversation', aiConversationSchema);
