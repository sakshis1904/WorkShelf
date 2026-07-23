import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ToolLogModel } from "@/repositories/tool-log.repository";
import { TaskModel } from "@/repositories/task.repository";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { searchParams } = req.nextUrl;
    const workspaceId = searchParams.get("workspaceId");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = 20;

    if (!workspaceId) {
      return NextResponse.json({ success: false, error: "workspaceId required" }, { status: 400 });
    }

    await connectToDatabase();
    const wid = new Types.ObjectId(workspaceId);
    const skip = (page - 1) * pageSize;

    const [logs, total] = await Promise.all([
      ToolLogModel.find({ workspaceId: wid, userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      ToolLogModel.countDocuments({ workspaceId: wid, userId }),
    ]);

    return NextResponse.json({
      success: true,
      data: { logs, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    logger.error({ error }, "GET /api/tools failed");
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
