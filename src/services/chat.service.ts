import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { ChatModel, ChatMessageModel } from "@/repositories/chat.repository";
import { logger } from "@/lib/logger";
import { PAGINATION_CONFIG } from "@/config/app";

export async function createChat(
  workspaceId: string,
  userId: string,
  firstMessage: string
) {
  await connectToDatabase();

  const title = firstMessage.slice(0, 80) || "New Chat";

  const chat = await ChatModel.create({
    workspaceId: new Types.ObjectId(workspaceId),
    userId,
    title,
    messageCount: 0,
  });

  return chat;
}

export async function getChatsByWorkspace(
  workspaceId: string,
  userId: string,
  page = 1,
  pageSize = PAGINATION_CONFIG.defaultPageSize
) {
  await connectToDatabase();
  const wid = new Types.ObjectId(workspaceId);
  const skip = (page - 1) * pageSize;

  const [chats, total] = await Promise.all([
    ChatModel.find({ workspaceId: wid, userId })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
    ChatModel.countDocuments({ workspaceId: wid, userId }),
  ]);

  return { chats, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getChatMessages(
  chatId: string,
  userId: string,
  page = 1,
  pageSize = 50
) {
  await connectToDatabase();
  const cid = new Types.ObjectId(chatId);

  const chat = await ChatModel.findOne({ _id: cid, userId });
  if (!chat) throw new Error("Chat not found");

  const skip = (page - 1) * pageSize;
  const [messages, total] = await Promise.all([
    ChatMessageModel.find({ chatId: cid })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
    ChatMessageModel.countDocuments({ chatId: cid }),
  ]);

  return { chat, messages, total };
}

export async function addMessage(params: {
  chatId: string;
  workspaceId: string;
  userId: string;
  role: "user" | "assistant" | "tool";
  content: string;
  sources?: unknown[];
  toolCalls?: unknown[];
  tokenUsage?: { prompt: number; completion: number; total: number };
  latencyMs?: number;
}) {
  await connectToDatabase();
  const cid = new Types.ObjectId(params.chatId);

  const message = await ChatMessageModel.create({
    chatId: cid,
    workspaceId: new Types.ObjectId(params.workspaceId),
    userId: params.userId,
    role: params.role,
    content: params.content,
    sources: params.sources,
    toolCalls: params.toolCalls,
    tokenUsage: params.tokenUsage,
    latencyMs: params.latencyMs,
  });

  await ChatModel.findByIdAndUpdate(cid, {
    $inc: { messageCount: 1 },
    updatedAt: new Date(),
  });

  return message;
}

export async function deleteChat(chatId: string, userId: string) {
  await connectToDatabase();
  const cid = new Types.ObjectId(chatId);

  const chat = await ChatModel.findOne({ _id: cid, userId });
  if (!chat) throw new Error("Chat not found");

  await ChatMessageModel.deleteMany({ chatId: cid });
  await ChatModel.deleteOne({ _id: cid });

  logger.info({ chatId, userId }, "Chat deleted");
}
