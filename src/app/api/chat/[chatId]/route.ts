import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getChatMessages, deleteChat } from "@/services/chat.service";
import { logger } from "@/lib/logger";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { chatId } = await params;
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
    const result = await getChatMessages(chatId, userId, page);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error({ error }, "GET /api/chat/[id] failed");
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { chatId } = await params;
    await deleteChat(chatId, userId);
    return NextResponse.json({ success: true, message: "Chat deleted" });
  } catch (error) {
    logger.error({ error }, "DELETE /api/chat/[id] failed");
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
