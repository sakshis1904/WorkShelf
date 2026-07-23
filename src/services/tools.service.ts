import { z } from "zod";
import { Types } from "mongoose";
import { SchemaType } from "@google/generative-ai";
import { connectToDatabase } from "@/lib/mongodb";
import { TaskModel } from "@/repositories/task.repository";
import { ToolLogModel } from "@/repositories/tool-log.repository";
import { logger } from "@/lib/logger";
import { TOOL_NAMES } from "@/constants";

// ─── Zod Schemas for tool inputs ─────────────────────────────────────────────

export const SaveTaskInputSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(1000).optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.string().optional(),
});

export const SendSummaryInputSchema = z.object({
  summary: z.string().min(1).max(4000),
  destination: z.enum(["slack", "discord"]).default("slack"),
  title: z.string().max(200).optional(),
});

export type SaveTaskInput = z.infer<typeof SaveTaskInputSchema>;
export type SendSummaryInput = z.infer<typeof SendSummaryInputSchema>;

// ─── Tool Definitions for Gemini ─────────────────────────────────────────────

export const toolDefinitions = [
  {
    name: TOOL_NAMES.SAVE_TASK,
    description:
      "Save a task or action item into the current workspace. Use this when the user mentions something they need to do, a to-do, or an action item.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING, description: "Short task title (required)" },
        description: { type: SchemaType.STRING, description: "Detailed description of the task (optional)" },
        priority: { type: SchemaType.STRING, enum: ["low", "medium", "high"], description: "Task priority" },
        dueDate: { type: SchemaType.STRING, description: "Due date in ISO 8601 format (optional)" },
      },
      required: ["title"],
    },
  },
  {
    name: TOOL_NAMES.SEND_SUMMARY,
    description:
      "Send a summary of findings or document insights to Slack or Discord. Use when the user asks to share or send a summary.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        summary: { type: SchemaType.STRING, description: "The summary text to send" },
        destination: { type: SchemaType.STRING, enum: ["slack", "discord"], description: "Where to send" },
        title: { type: SchemaType.STRING, description: "Optional title for the summary" },
      },
      required: ["summary"],
    },
  },
];

// ─── Individual Tool Handlers ─────────────────────────────────────────────────

async function handleSaveTask(
  rawInput: Record<string, unknown>,
  workspaceId: string,
  userId: string
): Promise<Record<string, unknown>> {
  const parsed = SaveTaskInputSchema.parse(rawInput);

  const task = await TaskModel.create({
    workspaceId: new Types.ObjectId(workspaceId),
    userId,
    title: parsed.title,
    description: parsed.description,
    priority: parsed.priority,
    dueDate: parsed.dueDate ? new Date(parsed.dueDate) : undefined,
    source: "ai",
    status: "todo",
  });

  return {
    taskId: task._id.toString(),
    title: task.title,
    priority: task.priority,
    status: task.status,
    message: `Task "${task.title}" saved successfully.`,
  };
}

async function handleSendSummary(
  rawInput: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const parsed = SendSummaryInputSchema.parse(rawInput);

  const webhookUrl =
    parsed.destination === "discord"
      ? process.env.DISCORD_WEBHOOK
      : process.env.SLACK_WEBHOOK;

  if (!webhookUrl) {
    throw new Error(`No webhook configured for ${parsed.destination}`);
  }

  const payload =
    parsed.destination === "discord"
      ? {
          embeds: [
            {
              title: parsed.title || "WorkShelf Summary",
              description: parsed.summary,
              color: 0x6366f1,
              timestamp: new Date().toISOString(),
              footer: { text: "WorkShelf AI Assistant" },
            },
          ],
        }
      : {
          text: parsed.title
            ? `*${parsed.title}*\n\n${parsed.summary}`
            : parsed.summary,
          username: "WorkShelf",
        };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Webhook request failed: ${response.statusText}`);
  }

  return {
    destination: parsed.destination,
    message: `Summary sent to ${parsed.destination} successfully.`,
  };
}

// ─── Tool Executor ────────────────────────────────────────────────────────────

interface ExecuteToolParams {
  toolName: string;
  input: Record<string, unknown>;
  workspaceId: string;
  userId: string;
  chatId?: string;
}

export async function executeTool(params: ExecuteToolParams) {
  await connectToDatabase();
  const startTime = Date.now();

  const logEntry = await ToolLogModel.create({
    workspaceId: new Types.ObjectId(params.workspaceId),
    userId: params.userId,
    chatId: params.chatId ? new Types.ObjectId(params.chatId) : undefined,
    toolName: params.toolName,
    input: params.input,
    status: "pending",
  });

  try {
    let output: Record<string, unknown>;

    switch (params.toolName) {
      case TOOL_NAMES.SAVE_TASK:
        output = await handleSaveTask(params.input, params.workspaceId, params.userId);
        break;
      case TOOL_NAMES.SEND_SUMMARY:
        output = await handleSendSummary(params.input);
        break;
      default:
        throw new Error(`Unknown tool: ${params.toolName}`);
    }

    const executionMs = Date.now() - startTime;
    await ToolLogModel.findByIdAndUpdate(logEntry._id, { status: "success", output, executionMs });

    logger.info(
      { toolName: params.toolName, executionMs, workspaceId: params.workspaceId },
      "Tool executed successfully"
    );

    return { success: true, output, executionMs };
  } catch (error) {
    const executionMs = Date.now() - startTime;
    const errorMessage = (error as Error).message;

    await ToolLogModel.findByIdAndUpdate(logEntry._id, {
      status: "failed",
      errorMessage,
      executionMs,
    });

    logger.error({ error, toolName: params.toolName }, "Tool execution failed");
    return { success: false, error: errorMessage, executionMs };
  }
}
