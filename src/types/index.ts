import { Types } from "mongoose";

// ─── Workspace ───────────────────────────────────────────────────────────────

export interface IWorkspace {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  userId: string; // Clerk user ID
  color: string;
  icon: string;
  isDefault: boolean;
  documentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type WorkspaceCreateInput = {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
};

export type WorkspaceUpdateInput = Partial<WorkspaceCreateInput>;

// ─── Document ────────────────────────────────────────────────────────────────

export interface IDocument {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  userId: string;
  name: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  fileKey: string;
  contentHash: string; // SHA-256 for dedup
  chunksCount: number;
  status: "processing" | "ready" | "failed";
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── DocumentChunk ───────────────────────────────────────────────────────────

export interface IDocumentChunk {
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

// ─── Chat ────────────────────────────────────────────────────────────────────

export interface IChat {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  userId: string;
  title: string;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type MessageRole = "user" | "assistant" | "tool";

export interface IChatMessage {
  _id: Types.ObjectId;
  chatId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  userId: string;
  role: MessageRole;
  content: string;
  sources?: RetrievedChunk[];
  toolCalls?: ToolCallRecord[];
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
  latencyMs?: number;
  createdAt: Date;
}

// ─── ToolLog ─────────────────────────────────────────────────────────────────

export interface IToolLog {
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

// ─── Task ────────────────────────────────────────────────────────────────────

export interface ITask {
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

// ─── RAG ─────────────────────────────────────────────────────────────────────

export interface RetrievedChunk {
  chunkId: string;
  documentId: string;
  documentName: string;
  content: string;
  score: number;
  chunkIndex: number;
  metadata: IDocumentChunk["metadata"];
}

export interface RagResult {
  answer: string;
  sources: RetrievedChunk[];
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
  latencyMs: number;
}

// ─── Tool Calling ─────────────────────────────────────────────────────────────

export interface ToolCallRecord {
  toolName: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  status: "success" | "failed";
  errorMessage?: string;
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ─── Dashboard Stats ─────────────────────────────────────────────────────────

export interface WorkspaceStats {
  totalDocuments: number;
  totalChats: number;
  totalMessages: number;
  totalTasks: number;
  totalToolExecutions: number;
  storageUsedBytes: number;
}
