import { GoogleGenerativeAI, TaskType } from "@google/generative-ai";
import { RAG_CONFIG } from "@/config/app";
import { logger } from "@/lib/logger";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const embeddingModel = genAI.getGenerativeModel({
  model: RAG_CONFIG.embeddingModel,
});

// gemini-embedding-2 supports dimensions: 768, 1024, 2048, 3072
// We use 768 to match our vector index configuration
const EMBEDDING_DIMENSIONS = 768;

export async function generateEmbedding(text: string): Promise<number[]> {
  const result = await embeddingModel.embedContent({
    content: { role: "user", parts: [{ text }] },
    taskType: TaskType.RETRIEVAL_DOCUMENT,
  });
  return result.embedding.values;
}

export async function generateEmbeddingsBatch(
  texts: string[],
  batchSize = 10
): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchEmbeddings = await Promise.all(
      batch.map((text) => generateEmbedding(text))
    );
    embeddings.push(...batchEmbeddings);
    logger.debug(
      { processed: Math.min(i + batchSize, texts.length), total: texts.length },
      "Embedding batch complete"
    );
  }

  return embeddings;
}
