import { Schema, model, models, Document, Types } from "mongoose";

export interface IDocumentChunkDocument extends Document {
  _id: Types.ObjectId;
  documentId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  userId: string;
  content: string;
  embedding: number[];
  chunkIndex: number;
  metadata: {
    page?: number;
    startChar?: number;
    endChar?: number;
    source: string;
  };
  createdAt: Date;
}

const DocumentChunkSchema = new Schema<IDocumentChunkDocument>(
  {
    documentId: { type: Schema.Types.ObjectId, ref: "Document", required: true, index: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    userId: { type: String, required: true },
    content: { type: String, required: true },
    embedding: { type: [Number], required: true },
    chunkIndex: { type: Number, required: true },
    metadata: {
      page: { type: Number },
      startChar: { type: Number },
      endChar: { type: Number },
      source: { type: String, required: true },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Vector search index definition (created in MongoDB Atlas UI)
// Index name: vector_index
// Field: embedding (768 dims for text-embedding-004)
DocumentChunkSchema.index({ workspaceId: 1, documentId: 1 });
DocumentChunkSchema.index({ documentId: 1, chunkIndex: 1 });

export const DocumentChunkModel =
  models.DocumentChunk ||
  model<IDocumentChunkDocument>("DocumentChunk", DocumentChunkSchema);
