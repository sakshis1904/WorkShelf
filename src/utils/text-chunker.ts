import { RAG_CONFIG } from "@/config/app";

export interface TextChunk {
  content: string;
  chunkIndex: number;
  metadata: {
    startChar: number;
    endChar: number;
    source: string;
  };
}

export function chunkText(
  text: string,
  source: string,
  chunkSize: number = RAG_CONFIG.chunkSize,
  chunkOverlap: number = RAG_CONFIG.chunkOverlap
): TextChunk[] {
  const cleanedText = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!cleanedText) return [];

  const chunks: TextChunk[] = [];
  let start = 0;
  let chunkIndex = 0;

  while (start < cleanedText.length) {
    const end = Math.min(start + chunkSize, cleanedText.length);
    let chunkEnd = end;

    // Try to break at sentence or paragraph boundary
    if (end < cleanedText.length) {
      const lastParagraph = cleanedText.lastIndexOf("\n\n", end);
      const lastSentence = Math.max(
        cleanedText.lastIndexOf(". ", end),
        cleanedText.lastIndexOf("? ", end),
        cleanedText.lastIndexOf("! ", end)
      );
      const lastNewline = cleanedText.lastIndexOf("\n", end);

      if (lastParagraph > start + chunkSize / 2) {
        chunkEnd = lastParagraph + 2;
      } else if (lastSentence > start + chunkSize / 2) {
        chunkEnd = lastSentence + 2;
      } else if (lastNewline > start + chunkSize / 2) {
        chunkEnd = lastNewline + 1;
      }
    }

    const content = cleanedText.slice(start, chunkEnd).trim();
    if (content.length > 50) {
      chunks.push({
        content,
        chunkIndex,
        metadata: { startChar: start, endChar: chunkEnd, source },
      });
      chunkIndex++;
    }

    if (chunkEnd === cleanedText.length) {
      break;
    }

    const nextStart = chunkEnd - chunkOverlap;
    if (nextStart <= start) {
      start = chunkEnd;
    } else {
      start = nextStart;
    }
  }

  return chunks;
}
