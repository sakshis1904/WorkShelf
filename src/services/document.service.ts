import crypto from "crypto";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { DocumentModel } from "@/repositories/document.repository";
import { DocumentChunkModel } from "@/repositories/chunk.repository";
import { WorkspaceModel } from "@/repositories/workspace.repository";
import { extractTextFromFile } from "@/utils/text-extractor";
import { chunkText } from "@/utils/text-chunker";
import { generateEmbeddingsBatch } from "./embedding.service";
import { logger } from "@/lib/logger";
import { ERROR_MESSAGES } from "@/constants";
import { PAGINATION_CONFIG } from "@/config/app";

interface ProcessDocumentInput {
  fileUrl: string;
  fileKey: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  workspaceId: string;
  userId: string;
}

export async function processDocument(input: ProcessDocumentInput) {
  console.log("[processDocument] Starting:", input.fileName, "workspace:", input.workspaceId);
  await connectToDatabase();
  const wid = new Types.ObjectId(input.workspaceId);

  // Fetch file content
  console.log("[processDocument] Fetching file from:", input.fileUrl);
  const response = await fetch(input.fileUrl);
  if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  console.log("[processDocument] File fetched, size:", buffer.length);

  // Compute content hash for deduplication
  const contentHash = crypto.createHash("sha256").update(buffer).digest("hex");

  // Check for duplicate in same workspace
  const duplicate = await DocumentModel.findOne({
    workspaceId: wid,
    contentHash,
  });
  if (duplicate) {
    logger.warn(
      { contentHash, workspaceId: input.workspaceId },
      "Duplicate document detected, skipping"
    );
    throw new Error(ERROR_MESSAGES.DUPLICATE_DOCUMENT);
  }

  // Create document record
  const document = await DocumentModel.create({
    workspaceId: wid,
    userId: input.userId,
    name: input.fileName,
    originalName: input.fileName,
    fileType: input.fileType,
    fileSize: input.fileSize,
    fileUrl: input.fileUrl,
    fileKey: input.fileKey,
    contentHash,
    status: "processing",
  });

  try {
    // Extract text
    console.log("[processDocument] Extracting text, fileType:", input.fileType);
    const { text } = await extractTextFromFile(buffer, input.fileType, input.fileName);
    console.log("[processDocument] Extracted text length:", text.length);
    if (!text.trim()) throw new Error("No text content extracted from file");

    // Chunk text
    const chunks = chunkText(text, input.fileName);
    console.log("[processDocument] Chunks generated:", chunks.length);
    if (chunks.length === 0) throw new Error("No chunks generated from text");

    // Generate embeddings in batches
    console.log("[processDocument] Generating embeddings for", chunks.length, "chunks...");
    const embeddings = await generateEmbeddingsBatch(chunks.map((c) => c.content));
    console.log("[processDocument] Embeddings generated:", embeddings.length);

    // Store chunks with embeddings
    const chunkDocs = chunks.map((chunk, idx) => ({
      documentId: document._id,
      workspaceId: wid,
      userId: input.userId,
      content: chunk.content,
      embedding: embeddings[idx],
      chunkIndex: chunk.chunkIndex,
      metadata: { ...chunk.metadata, source: input.fileName },
    }));

    await DocumentChunkModel.insertMany(chunkDocs);

    // Update document status
    await DocumentModel.findByIdAndUpdate(document._id, {
      status: "ready",
      chunksCount: chunks.length,
    });

    // Update workspace document count
    await WorkspaceModel.findByIdAndUpdate(wid, {
      $inc: { documentsCount: 1 },
    });

    logger.info(
      { documentId: document._id.toString(), chunks: chunks.length },
      "Document processed successfully"
    );

    return document;
  } catch (error) {
    console.error("[processDocument] FAILED:", (error as Error).message, (error as Error).stack);
    await DocumentModel.findByIdAndUpdate(document._id, {
      status: "failed",
      errorMessage: (error as Error).message,
    });
    logger.error({ error, documentId: document._id.toString() }, "Document processing failed");
    throw error;
  }
}

export async function getDocumentsByWorkspace(
  workspaceId: string,
  userId: string,
  page = 1,
  pageSize = PAGINATION_CONFIG.defaultPageSize
) {
  await connectToDatabase();
  const wid = new Types.ObjectId(workspaceId);
  const skip = (page - 1) * pageSize;

  const [documents, total] = await Promise.all([
    DocumentModel.find({ workspaceId: wid, userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
    DocumentModel.countDocuments({ workspaceId: wid, userId }),
  ]);

  return { documents, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function deleteDocument(documentId: string, userId: string) {
  await connectToDatabase();
  const did = new Types.ObjectId(documentId);

  const document = await DocumentModel.findOne({ _id: did, userId });
  if (!document) throw new Error(ERROR_MESSAGES.DOCUMENT_NOT_FOUND);

  await DocumentChunkModel.deleteMany({ documentId: did });
  await DocumentModel.deleteOne({ _id: did });

  await WorkspaceModel.findByIdAndUpdate(document.workspaceId, {
    $inc: { documentsCount: -1 },
  });

  logger.info({ documentId, userId }, "Document deleted");
}
