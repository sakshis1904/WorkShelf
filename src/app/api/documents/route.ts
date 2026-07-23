import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getDocumentsByWorkspace } from "@/services/document.service";
import { connectToDatabase } from "@/lib/mongodb";
import { DocumentModel } from "@/repositories/document.repository";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { searchParams } = req.nextUrl;
    const workspaceId = searchParams.get("workspaceId");
    const page = parseInt(searchParams.get("page") || "1");

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: "workspaceId is required" },
        { status: 400 }
      );
    }

    const result = await getDocumentsByWorkspace(workspaceId, userId, page);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error({ error }, "GET /api/documents failed");
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

// PATCH /api/documents?action=reset-stuck — marks all "processing" docs older than 5 min as "failed"
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { searchParams } = req.nextUrl;
    const action = searchParams.get("action");
    if (action !== "reset-stuck") {
      return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
    }

    await connectToDatabase();
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const result = await DocumentModel.updateMany(
      { userId, status: "processing", createdAt: { $lt: fiveMinutesAgo } },
      { status: "failed", errorMessage: "Processing was interrupted (server restarted)" }
    );

    return NextResponse.json({
      success: true,
      message: `Reset ${result.modifiedCount} stuck document(s) to failed`,
      count: result.modifiedCount,
    });
  } catch (error) {
    logger.error({ error }, "PATCH /api/documents reset-stuck failed");
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
