import { Schema, model, models, Document, Types } from "mongoose";

export interface ITaskDocument extends Document {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  userId: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  status: "todo" | "in-progress" | "done";
  dueDate?: Date;
  source: "manual" | "ai";
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITaskDocument>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    userId: { type: String, required: true },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, trim: true, maxlength: 1000 },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    status: { type: String, enum: ["todo", "in-progress", "done"], default: "todo" },
    dueDate: { type: Date },
    source: { type: String, enum: ["manual", "ai"], default: "manual" },
  },
  { timestamps: true }
);

TaskSchema.index({ workspaceId: 1, status: 1 });
TaskSchema.index({ workspaceId: 1, createdAt: -1 });

export const TaskModel =
  models.Task || model<ITaskDocument>("Task", TaskSchema);
