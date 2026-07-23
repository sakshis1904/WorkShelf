import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { createWorkspace, getUserWorkspaces } from "@/services/workspace.service";
import { logger } from "@/lib/logger";

const CreateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export async function GET() {
  try {
    const { userId } = await requireAuth();
    const workspaces = await getUserWorkspaces(userId);
    return NextResponse.json({ success: true, data: workspaces });
  } catch (error) {
    logger.error({ error }, "GET /api/workspaces failed");
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await req.json();
    const input = CreateWorkspaceSchema.parse(body);
    const workspace = await createWorkspace(userId, input);
    return NextResponse.json({ success: true, data: workspace }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors }, { status: 400 });
    }
    logger.error({ error }, "POST /api/workspaces failed");
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
