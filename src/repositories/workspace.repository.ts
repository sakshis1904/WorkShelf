import { Schema, model, models, Document, Types } from "mongoose";

export interface IWorkspaceDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  userId: string;
  color: string;
  icon: string;
  isDefault: boolean;
  documentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceSchema = new Schema<IWorkspaceDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500 },
    userId: { type: String, required: true, index: true },
    color: { type: String, default: "#6366f1" },
    icon: { type: String, default: "folder" },
    isDefault: { type: Boolean, default: false },
    documentsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

WorkspaceSchema.index({ userId: 1, name: 1 }, { unique: true });

export const WorkspaceModel =
  models.Workspace ||
  model<IWorkspaceDocument>("Workspace", WorkspaceSchema);
