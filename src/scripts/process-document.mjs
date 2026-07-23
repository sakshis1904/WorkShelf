/**
 * Self-contained document processing pipeline.
 * Runs as a child process with its own fresh V8 heap, completely isolated
 * from the Next.js dev server's bloated heap.
 *
 * Receives: JSON via stdin { fileUrl, fileKey, fileName, fileSize, fileType, workspaceId, userId }
 * Reads env:  MONGODB_URI, GEMINI_API_KEY
 * Outputs:   JSON result to stdout, errors to stderr
 */

import crypto from "crypto";
import { MongoClient, ObjectId } from "mongodb";
import { GoogleGenerativeAI } from "@google/generative-ai";

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;
const EMBED_BATCH = 5;
const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// --- Timeout handler ---
const timeout = setTimeout(() => {
  console.error("[process-document] TIMEOUT: Process exceeded 5 minutes");
  process.stderr.write("Processing timeout exceeded");
  process.exit(1);
}, TIMEOUT_MS);

// --- Read stdin ---
let raw = "";
process.stdin.setEncoding("utf-8");
for await (const chunk of process.stdin) raw += chunk;

console.log("[process-document] Received input, parsing JSON...");
const input = JSON.parse(raw);
const { fileUrl, fileKey, fileName, fileSize, fileType, workspaceId, userId } = input;
console.log(`[process-document] Processing: ${fileName} (${fileType}, ${fileSize} bytes)`);

const MONGODB_URI = process.env.MONGODB_URI;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!MONGODB_URI) { 
  console.error("[process-document] ERROR: MONGODB_URI not set");
  process.stderr.write("MONGODB_URI not set"); 
  process.exit(1); 
}
if (!GEMINI_API_KEY) { 
  console.error("[process-document] ERROR: GEMINI_API_KEY not set");
  process.stderr.write("GEMINI_API_KEY not set"); 
  process.exit(1); 
}

console.log("[process-document] Environment variables validated");

// --- Connect to MongoDB (native driver, no mongoose, no schema overhead) ---
console.log("[process-document] Connecting to MongoDB...");
const client = new MongoClient(MONGODB_URI);
await client.connect();
console.log("[process-document] MongoDB connected");
const db = client.db(); // uses DB name from connection string

const docsCol       = db.collection("documents");
const chunksCol     = db.collection("documentchunks");
const workspacesCol = db.collection("workspaces");

const wid = new ObjectId(workspaceId);

// --- Create document record (status: processing) ---
const { insertedId: documentId } = await docsCol.insertOne({
  workspaceId: wid, userId,
  name: fileName, originalName: fileName,
  fileType, fileSize, fileUrl, fileKey,
  contentHash: "", chunksCount: 0,
  status: "processing", errorMessage: null,
  createdAt: new Date(), updatedAt: new Date(),
});

console.log(`[process-document] Created doc ${documentId} — starting pipeline`);

try {
  // --- Fetch file bytes ---
  const res = await fetch(fileUrl);
  if (!res.ok) throw new Error(`Fetch failed: ${res.statusText}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  console.log(`[process-document] Fetched ${buffer.length} bytes`);

  // --- Deduplication ---
  const contentHash = crypto.createHash("sha256").update(buffer).digest("hex");
  const duplicate = await docsCol.findOne({ workspaceId: wid, contentHash, _id: { $ne: documentId } });
  if (duplicate) {
    await docsCol.deleteOne({ _id: documentId });
    await client.close();
    process.stderr.write("Duplicate document");
    process.exit(1);
  }
  await docsCol.updateOne({ _id: documentId }, { $set: { contentHash } });

  // --- Text extraction ---
  let text = "";
  const nt = fileType.toLowerCase();
  if (nt === "application/pdf" || fileName.endsWith(".pdf")) {
    const { getDocumentProxy, extractText } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const r = await extractText(pdf, { mergePages: true });
    text = r.text;
  } else if (nt.includes("wordprocessingml") || fileName.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const r = await mammoth.extractRawText({ buffer });
    text = r.value;
  } else {
    text = buffer.toString("utf-8");
  }
  console.log(`[process-document] Extracted ${text.length} chars`);
  if (!text.trim()) throw new Error("No text extracted from file");

  // --- Chunking ---
  const chunks = chunkText(text, fileName);
  console.log(`[process-document] ${chunks.length} chunks`);
  if (chunks.length === 0) throw new Error("No chunks generated");

  // --- Embeddings via Gemini ---
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const embModel = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
  const embeddings = [];
  for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
    const batch = chunks.slice(i, i + EMBED_BATCH);
    try {
      const results = await Promise.all(
        batch.map(c => embModel.embedContent({
          content: { role: "user", parts: [{ text: c.content }] },
          taskType: "RETRIEVAL_DOCUMENT",
          outputDimensionality: 768
        }).then(r => r.embedding.values))
      );
      embeddings.push(...results);
      console.log(`[process-document] Embeddings ${Math.min(i + EMBED_BATCH, chunks.length)}/${chunks.length}`);
    } catch (embErr) {
      console.error(`[process-document] Embedding batch ${i} failed: ${embErr.message}`);
      throw new Error(`Embedding failed at batch ${i}: ${embErr.message}`);
    }
  }

  // --- Save chunks to MongoDB ---
  await chunksCol.insertMany(chunks.map((c, i) => ({
    documentId, workspaceId: wid, userId,
    content: c.content,
    embedding: Array.from(embeddings[i]),
    chunkIndex: i,
    metadata: { source: fileName },
    createdAt: new Date(),
  })));

  // --- Mark document ready ---
  await docsCol.updateOne({ _id: documentId }, {
    $set: { status: "ready", chunksCount: chunks.length, updatedAt: new Date() },
  });
  await workspacesCol.updateOne({ _id: wid }, { $inc: { documentsCount: 1 } });

  await client.close();
  clearTimeout(timeout);
  console.log(`[process-document] SUCCESS — ${fileName} → ${chunks.length} chunks`);
  process.stdout.write(JSON.stringify({ success: true, documentId: documentId.toString(), chunks: chunks.length }));
  process.exit(0);

} catch (err) {
  clearTimeout(timeout);
  console.error(`[process-document] FAILED: ${err.message}`);
  console.error(err.stack);
  await docsCol.updateOne({ _id: documentId }, {
    $set: { status: "failed", errorMessage: err.message, updatedAt: new Date() },
  });
  await client.close();
  process.stderr.write(err.message || String(err));
  process.exit(1);
}

// --- Simple chunker ---
function chunkText(text, source) {
  const result = [];
  const words = text.split(/\s+/).filter(w => w.length > 0);
  let current = [];
  let length = 0;

  for (const word of words) {
    current.push(word);
    length += word.length + 1;
    if (length >= CHUNK_SIZE) {
      const content = current.join(" ").trim();
      if (content.length > 50) result.push({ content });
      const overlapWords = current.slice(-Math.max(1, Math.floor(CHUNK_OVERLAP / 6)));
      current = [...overlapWords];
      length = current.join(" ").length;
    }
  }
  if (current.length > 0) {
    const content = current.join(" ").trim();
    if (content.length > 50) result.push({ content });
  }
  return result;
}
