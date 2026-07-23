import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { WorkspaceModel } from "@/repositories/workspace.repository";
import { DocumentModel } from "@/repositories/document.repository";
import { DocumentChunkModel } from "@/repositories/chunk.repository";
import { ChatModel, ChatMessageModel } from "@/repositories/chat.repository";
import { TaskModel } from "@/repositories/task.repository";
import { ToolLogModel } from "@/repositories/tool-log.repository";
import type { WorkspaceCreateInput, WorkspaceUpdateInput, WorkspaceStats } from "@/types";
import { generateWorkspaceColor } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { ERROR_MESSAGES } from "@/constants";

export async function createWorkspace(userId: string, input: WorkspaceCreateInput) {
  await connectToDatabase();

  const existingCount = await WorkspaceModel.countDocuments({ userId });
  const isDefault = existingCount === 0;

  const workspace = await WorkspaceModel.create({
    ...input,
    userId,
    color: input.color || generateWorkspaceColor(),
    icon: input.icon || "folder",
    isDefault,
  });

  logger.info({ workspaceId: workspace._id.toString(), userId }, "Workspace created");
  return workspace;
}

export async function getUserWorkspaces(userId: string) {
  await connectToDatabase();
  return WorkspaceModel.find({ userId }).sort({ isDefault: -1, createdAt: 1 }).lean();
}

export async function getWorkspaceById(workspaceId: string, userId: string) {
  await connectToDatabase();
  const workspace = await WorkspaceModel.findOne({
    _id: new Types.ObjectId(workspaceId),
    userId,
  }).lean();

  if (!workspace) throw new Error(ERROR_MESSAGES.WORKSPACE_NOT_FOUND);
  return workspace;
}

export async function updateWorkspace(
  workspaceId: string,
  userId: string,
  input: WorkspaceUpdateInput
) {
  await connectToDatabase();
  const workspace = await WorkspaceModel.findOneAndUpdate(
    { _id: new Types.ObjectId(workspaceId), userId },
    { $set: input },
    { new: true }
  ).lean();

  if (!workspace) throw new Error(ERROR_MESSAGES.WORKSPACE_NOT_FOUND);
  logger.info({ workspaceId, userId }, "Workspace updated");
  return workspace;
}

export async function deleteWorkspace(workspaceId: string, userId: string) {
  await connectToDatabase();
  const wid = new Types.ObjectId(workspaceId);

  const workspace = await WorkspaceModel.findOne({ _id: wid, userId });
  if (!workspace) throw new Error(ERROR_MESSAGES.WORKSPACE_NOT_FOUND);

  // Cascade delete all workspace data
  const documentIds = await DocumentModel.find({ workspaceId: wid }).distinct("_id");
  await DocumentChunkModel.deleteMany({ workspaceId: wid });
  await DocumentModel.deleteMany({ workspaceId: wid });
  const chatIds = await ChatModel.find({ workspaceId: wid }).distinct("_id");
  await ChatMessageModel.deleteMany({ chatId: { $in: chatIds } });
  await ChatModel.deleteMany({ workspaceId: wid });
  await TaskModel.deleteMany({ workspaceId: wid });
  await ToolLogModel.deleteMany({ workspaceId: wid });
  await WorkspaceModel.deleteOne({ _id: wid });

  logger.info(
    { workspaceId, userId, documentsDeleted: documentIds.length },
    "Workspace and all data deleted"
  );
}

export async function getWorkspaceStats(workspaceId: string, userId: string): Promise<WorkspaceStats> {
  await connectToDatabase();
  const wid = new Types.ObjectId(workspaceId);

  const [
    totalDocuments,
    totalChats,
    totalMessages,
    totalTasks,
    totalToolExecutions,
    storageResult,
  ] = await Promise.all([
    DocumentModel.countDocuments({ workspaceId: wid, userId }),
    ChatModel.countDocuments({ workspaceId: wid, userId }),
    ChatMessageModel.countDocuments({ workspaceId: wid, userId }),
    TaskModel.countDocuments({ workspaceId: wid, userId }),
    ToolLogModel.countDocuments({ workspaceId: wid, userId }),
    DocumentModel.aggregate([
      { $match: { workspaceId: wid, userId } },
      { $group: { _id: null, total: { $sum: "$fileSize" } } },
    ]),
  ]);

  return {
    totalDocuments,
    totalChats,
    totalMessages,
    totalTasks,
    totalToolExecutions,
    storageUsedBytes: storageResult[0]?.total ?? 0,
  };
}
