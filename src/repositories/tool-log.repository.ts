import { Schema, model, models, Document, Types } from "mongoose";

export interface IToolLogDocument extends Document {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  userId: string;
  chatId?: Types.ObjectId;
  toolName: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  status: "pending" | "success" | "failed";
  errorMessage?: string;
  executionMs?: number;
  createdAt: Date;
}

const ToolLogSchema = new Schema<IToolLogDocument>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    userId: { type: String, required: true },
    chatId: { type: Schema.Types.ObjectId, ref: "Chat" },
    toolName: { type: String, required: true },
    input: { type: Schema.Types.Mixed, required: true },
    output: { type: Schema.Types.Mixed },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    errorMessage: { type: String },
    executionMs: { type: Number },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ToolLogSchema.index({ workspaceId: 1, createdAt: -1 });
ToolLogSchema.index({ toolName: 1, status: 1 });

export const ToolLogModel =
  models.ToolLog || model<IToolLogDocument>("ToolLog", ToolLogSchema);
