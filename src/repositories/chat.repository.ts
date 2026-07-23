import { Schema, model, models, Document, Types } from "mongoose";

export interface IChatDocument extends Document {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  userId: string;
  title: string;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChatMessageDocument extends Document {
  _id: Types.ObjectId;
  chatId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  userId: string;
  role: "user" | "assistant" | "tool";
  content: string;
  sources?: Array<{
    chunkId: string;
    documentId: string;
    documentName: string;
    content: string;
    score: number;
    chunkIndex: number;
    metadata: { page?: number; source: string };
  }>;
  toolCalls?: Array<{
    toolName: string;
    input: Record<string, unknown>;
    output?: Record<string, unknown>;
    status: "success" | "failed";
    errorMessage?: string;
  }>;
  tokenUsage?: { prompt: number; completion: number; total: number };
  latencyMs?: number;
  createdAt: Date;
}

const ChatSchema = new Schema<IChatDocument>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    messageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ChatSchema.index({ workspaceId: 1, updatedAt: -1 });

const ChatMessageSchema = new Schema<IChatMessageDocument>(
  {
    chatId: { type: Schema.Types.ObjectId, ref: "Chat", required: true, index: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    userId: { type: String, required: true },
    role: { type: String, enum: ["user", "assistant", "tool"], required: true },
    content: { type: String, required: true },
    sources: [
      {
        chunkId: String,
        documentId: String,
        documentName: String,
        content: String,
        score: Number,
        chunkIndex: Number,
        metadata: { page: Number, source: String },
      },
    ],
    toolCalls: [
      {
        toolName: String,
        input: Schema.Types.Mixed,
        output: Schema.Types.Mixed,
        status: { type: String, enum: ["success", "failed"] },
        errorMessage: String,
      },
    ],
    tokenUsage: {
      prompt: Number,
      completion: Number,
      total: Number,
    },
    latencyMs: Number,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ChatMessageSchema.index({ chatId: 1, createdAt: 1 });

export const ChatModel =
  models.Chat || model<IChatDocument>("Chat", ChatSchema);

export const ChatMessageModel =
  models.ChatMessage ||
  model<IChatMessageDocument>("ChatMessage", ChatMessageSchema);
