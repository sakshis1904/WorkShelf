import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { deleteDocument } from "@/services/document.service";
import { logger } from "@/lib/logger";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { documentId } = await params;
    await deleteDocument(documentId, userId);
    return NextResponse.json({ success: true, message: "Document deleted" });
  } catch (error) {
    logger.error({ error }, "DELETE /api/documents/[id] failed");
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
