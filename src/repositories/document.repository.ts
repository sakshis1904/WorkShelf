import { Schema, model, models, Document, Types } from "mongoose";

export interface IDocumentDocument extends Document {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  userId: string;
  name: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  fileKey: string;
  contentHash: string;
  chunksCount: number;
  status: "processing" | "ready" | "failed";
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocumentDocument>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    originalName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    fileUrl: { type: String, required: true },
    fileKey: { type: String, required: true },
    contentHash: { type: String, required: true },
    chunksCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["processing", "ready", "failed"],
      default: "processing",
    },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

DocumentSchema.index({ workspaceId: 1, contentHash: 1 }, { unique: true });
DocumentSchema.index({ workspaceId: 1, createdAt: -1 });

export const DocumentModel =
  models.Document || model<IDocumentDocument>("Document", DocumentSchema);
