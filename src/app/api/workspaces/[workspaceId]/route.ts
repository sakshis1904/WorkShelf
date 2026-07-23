import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import {
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceStats,
} from "@/services/workspace.service";
import { logger } from "@/lib/logger";

const UpdateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { workspaceId } = await params;
    const [workspace, stats] = await Promise.all([
      getWorkspaceById(workspaceId, userId),
      getWorkspaceStats(workspaceId, userId),
    ]);
    return NextResponse.json({ success: true, data: { ...workspace, stats } });
  } catch (error) {
    logger.error({ error }, "GET /api/workspaces/[id] failed");
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 404 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { workspaceId } = await params;
    const body = await req.json();
    const input = UpdateWorkspaceSchema.parse(body);
    const workspace = await updateWorkspace(workspaceId, userId, input);
    return NextResponse.json({ success: true, data: workspace });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors }, { status: 400 });
    }
    logger.error({ error }, "PATCH /api/workspaces/[id] failed");
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { workspaceId } = await params;
    await deleteWorkspace(workspaceId, userId);
    return NextResponse.json({ success: true, message: "Workspace deleted" });
  } catch (error) {
    logger.error({ error }, "DELETE /api/workspaces/[id] failed");
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
