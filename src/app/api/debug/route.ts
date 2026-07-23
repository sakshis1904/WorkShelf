import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { retrieveRelevantChunks } from "@/services/rag.service";
import { logger } from "@/lib/logger";

const DebugQuerySchema = z.object({
  query: z.string().min(1).max(1000),
  workspaceId: z.string().min(1),
  topK: z.number().int().min(1).max(20).optional().default(5),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await req.json();
    const { query, workspaceId, topK } = DebugQuerySchema.parse(body);

    const startTime = Date.now();
    const chunks = await retrieveRelevantChunks(query, workspaceId, topK);
    const latencyMs = Date.now() - startTime;

    logger.info({ userId, workspaceId, query: query.slice(0, 50), chunks: chunks.length }, "Debug retrieval");

    return NextResponse.json({
      success: true,
      data: {
        workspaceId,
        query,
        chunks,
        latencyMs,
        totalRetrieved: chunks.length,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors }, { status: 400 });
    }
    logger.error({ error }, "POST /api/debug failed");
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
