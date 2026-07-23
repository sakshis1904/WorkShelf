export const ROUTES = {
  HOME: "/",
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
  DASHBOARD: "/dashboard",
  DOCUMENTS: "/dashboard/documents",
  CHAT: "/dashboard/chat",
  TOOL_LOGS: "/dashboard/tool-logs",
  DEBUG: "/dashboard/debug",
  SETTINGS: "/dashboard/settings",
  PROFILE: "/dashboard/profile",
} as const;

export const API_ROUTES = {
  WORKSPACES: "/api/workspaces",
  DOCUMENTS: "/api/documents",
  CHAT: "/api/chat",
  TOOLS: "/api/tools",
  DEBUG: "/api/debug",
  UPLOADTHING: "/api/uploadthing",
} as const;

export const ERROR_MESSAGES = {
  UNAUTHORIZED: "You are not authorized to perform this action.",
  NOT_FOUND: "The requested resource was not found.",
  INTERNAL_ERROR: "Something went wrong. Please try again.",
  INVALID_INPUT: "Invalid input provided.",
  WORKSPACE_NOT_FOUND: "Workspace not found.",
  DOCUMENT_NOT_FOUND: "Document not found.",
  DUPLICATE_DOCUMENT: "This document has already been uploaded.",
  UPLOAD_FAILED: "File upload failed. Please try again.",
  RAG_NO_CONTEXT: "I don't know based on the uploaded documents.",
} as const;

export const SUCCESS_MESSAGES = {
  WORKSPACE_CREATED: "Workspace created successfully.",
  WORKSPACE_UPDATED: "Workspace updated successfully.",
  WORKSPACE_DELETED: "Workspace deleted successfully.",
  DOCUMENT_UPLOADED: "Document uploaded and processed successfully.",
  DOCUMENT_DELETED: "Document deleted successfully.",
  TASK_SAVED: "Task saved successfully.",
  SUMMARY_SENT: "Summary sent successfully.",
} as const;

export const TOOL_NAMES = {
  SAVE_TASK: "saveTask",
  SEND_SUMMARY: "sendSummary",
} as const;
