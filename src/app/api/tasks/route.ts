import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Types } from "mongoose";
import { requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { TaskModel } from "@/repositories/task.repository";
import { logger } from "@/lib/logger";

const CreateTaskSchema = z.object({
  workspaceId: z.string().min(1),
  title: z.string().min(1).max(300),
  description: z.string().max(1000).optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { searchParams } = req.nextUrl;
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ success: false, error: "workspaceId required" }, { status: 400 });
    }

    await connectToDatabase();
    const tasks = await TaskModel.find({
      workspaceId: new Types.ObjectId(workspaceId),
      userId,
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: tasks });
  } catch (error) {
    logger.error({ error }, "GET /api/tasks failed");
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await req.json();
    const input = CreateTaskSchema.parse(body);

    await connectToDatabase();
    const task = await TaskModel.create({
      workspaceId: new Types.ObjectId(input.workspaceId),
      userId,
      title: input.title,
      description: input.description,
      priority: input.priority,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      source: "manual",
      status: "todo",
    });

    return NextResponse.json({ success: true, data: task }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors }, { status: 400 });
    }
    logger.error({ error }, "POST /api/tasks failed");
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
