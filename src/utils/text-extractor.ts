import { spawn } from "child_process";
import { join } from "path";
import { logger } from "@/lib/logger";

export interface ExtractedContent {
  text: string;
  pageCount?: number;
}

export async function extractTextFromFile(
  buffer: Buffer,
  fileType: string,
  fileName: string
): Promise<ExtractedContent> {
  const normalizedType = fileType.toLowerCase();

  if (normalizedType === "application/pdf" || fileName.endsWith(".pdf")) {
    return extractFromPdfChildProcess(buffer);
  }

  if (
    normalizedType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.endsWith(".docx")
  ) {
    return extractFromDocx(buffer);
  }

  if (
    normalizedType === "text/plain" ||
    normalizedType === "text/markdown" ||
    normalizedType === "text/csv" ||
    fileName.endsWith(".txt") ||
    fileName.endsWith(".md") ||
    fileName.endsWith(".csv")
  ) {
    return extractFromText(buffer);
  }

  throw new Error(`Unsupported file type: ${fileType}`);
}

/**
 * Spawns a separate Node.js child process to parse the PDF.
 * The child process gets its own fresh V8 heap (~200MB), completely
 * isolated from the Next.js dev server's bloated heap.
 * PDF bytes are piped to stdin; extracted text comes back on stdout.
 */
function extractFromPdfChildProcess(buffer: Buffer): Promise<ExtractedContent> {
  return new Promise((resolve, reject) => {
    const scriptPath = join(process.cwd(), "src/scripts/extract-pdf-text.mjs");
    const child = spawn(process.execPath, [scriptPath], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    const textChunks: Buffer[] = [];
    const errChunks: Buffer[] = [];

    child.stdout.on("data", (chunk: Buffer) => textChunks.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => errChunks.push(chunk));

    child.on("close", (code) => {
      if (code === 0) {
        const text = Buffer.concat(textChunks).toString("utf-8");
        logger.info({ bytes: buffer.length, chars: text.length }, "PDF text extracted via child process");
        resolve({ text });
      } else {
        const errMsg = Buffer.concat(errChunks).toString("utf-8");
        reject(new Error(`PDF extraction failed (exit ${code}): ${errMsg}`));
      }
    });

    child.on("error", (err) => reject(new Error(`Failed to spawn PDF extractor: ${err.message}`)));

    child.stdin.write(buffer);
    child.stdin.end();
  });
}

async function extractFromDocx(buffer: Buffer): Promise<ExtractedContent> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  if (result.messages.length > 0) {
    logger.warn({ messages: result.messages }, "DOCX extraction warnings");
  }
  return { text: result.value };
}

async function extractFromText(buffer: Buffer): Promise<ExtractedContent> {
  return { text: buffer.toString("utf-8") };
}
