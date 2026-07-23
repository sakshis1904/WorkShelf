import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, type Tool } from "@google/generative-ai";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { retrieveRelevantChunks, buildRagPrompt } from "@/services/rag.service";
import { createChat, addMessage, getChatMessages } from "@/services/chat.service";
import { executeTool, toolDefinitions } from "@/services/tools.service";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";
import { RAG_CONFIG } from "@/config/app";
import type { RetrievedChunk, ToolCallRecord } from "@/types";

const ChatRequestSchema = z.object({
  message: z.string().min(1).max(10000),
  workspaceId: z.string().min(1),
  chatId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    await connectToDatabase();
    const { userId } = await requireAuth();
    const body = await req.json();
    console.log("[chat] Request body:", { message: body.message?.substring(0, 50), workspaceId: body.workspaceId, chatId: body.chatId });
    const { message, workspaceId, chatId } = ChatRequestSchema.parse(body);

    // Step 1: Create or retrieve chat
    let activeChatId: string = chatId ?? "";
    if (!activeChatId) {
      const chat = await createChat(workspaceId, userId, message);
      activeChatId = chat._id.toString();
    }

    // Step 2: Save user message
    await addMessage({
      chatId: activeChatId,
      workspaceId,
      userId,
      role: "user",
      content: message,
    });

    // Step 3: Retrieve relevant chunks (RAG) with workspace isolation
    const retrievedChunks = await retrieveRelevantChunks(message, workspaceId);

    // Step 4: Build prompt with context
    const ragPrompt = buildRagPrompt(message, retrievedChunks);

    // Step 5: Get conversation history for context
    const { messages: history } = await getChatMessages(activeChatId, userId);
    const conversationHistory = history
      .slice(-10) // Last 10 messages for context window management
      .filter((m) => m.role !== "tool")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    // Step 6: Initialize Gemini with tool definitions
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: RAG_CONFIG.llmModel,
      tools: [{ functionDeclarations: toolDefinitions }] as unknown as Tool[],
    });

    // Step 7: Stream response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const chat = model.startChat({ history: conversationHistory.slice(0, -1) });
          const result = await chat.sendMessageStream(ragPrompt);

          let fullResponse = "";
          const toolCallsExecuted: ToolCallRecord[] = [];

          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              fullResponse += text;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "text", content: text })}\n\n`)
              );
            }

            // Handle tool calls
            const functionCalls = chunk.functionCalls();
            if (functionCalls && functionCalls.length > 0) {
              for (const fc of functionCalls) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "tool_call", toolName: fc.name })}\n\n`
                  )
                );

                const toolResult = await executeTool({
                  toolName: fc.name,
                  input: fc.args as Record<string, unknown>,
                  workspaceId,
                  userId,
                  chatId: activeChatId,
                });

                toolCallsExecuted.push({
                  toolName: fc.name,
                  input: fc.args as Record<string, unknown>,
                  output: toolResult.output,
                  status: toolResult.success ? "success" : "failed",
                  errorMessage: toolResult.success ? undefined : toolResult.error,
                });

                const toolMsg = toolResult.success
                  ? `✅ Tool **${fc.name}** executed: ${JSON.stringify(toolResult.output?.message ?? "Success")}`
                  : `❌ Tool **${fc.name}** failed: ${toolResult.error}`;

                fullResponse += "\n\n" + toolMsg;
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "tool_result", toolName: fc.name, success: toolResult.success, message: toolMsg })}\n\n`
                  )
                );
              }
            }
          }

          const latencyMs = Date.now() - startTime;

          // Save assistant message with sources and tool calls
          await addMessage({
            chatId: activeChatId!,
            workspaceId,
            userId,
            role: "assistant",
            content: fullResponse,
            sources: retrievedChunks,
            toolCalls: toolCallsExecuted,
            latencyMs,
          });

          // Send final metadata
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "done",
                chatId: activeChatId,
                sources: retrievedChunks,
                latencyMs,
              })}\n\n`
            )
          );

          controller.close();

          logger.info(
            { chatId: activeChatId, workspaceId, latencyMs, chunks: retrievedChunks.length },
            "Chat response completed"
          );
        } catch (streamError) {
          logger.error({ error: streamError }, "Streaming error");
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", message: (streamError as Error).message })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Chat-Id": activeChatId,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log("[chat] Validation error:", JSON.stringify(error.errors, null, 2));
      return NextResponse.json({ success: false, error: error.errors }, { status: 400 });
    }
    console.log("[chat] Error:", (error as Error).message);
    logger.error({ error }, "POST /api/chat failed");
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { searchParams } = req.nextUrl;
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ success: false, error: "workspaceId required" }, { status: 400 });
    }

    const { getChatsByWorkspace } = await import("@/services/chat.service");
    const page = parseInt(searchParams.get("page") || "1");
    const result = await getChatsByWorkspace(workspaceId, userId, page);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
