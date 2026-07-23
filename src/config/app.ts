export const APP_CONFIG = {
  name: "WorkShelf",
  description: "Multi-Workspace AI Document Assistant",
  version: "1.0.0",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
} as const;

export const RAG_CONFIG = {
  chunkSize: 1000,
  chunkOverlap: 200,
  topK: 5,
  similarityThreshold: 0.7,
  embeddingModel: "gemini-embedding-2",
  llmModel: "gemini-3.6-flash",
} as const;

export const UPLOAD_CONFIG = {
  maxFileSizeMB: 10,
  allowedTypes: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/markdown",
    "text/csv",
  ],
  allowedExtensions: [".pdf", ".docx", ".txt", ".md", ".csv"],
} as const;

export const PAGINATION_CONFIG = {
  defaultPageSize: 10,
  maxPageSize: 100,
} as const;
