"use client";

import { useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Array<{
    chunkId: string;
    documentId: string;
    documentName: string;
    content: string;
    score: number;
    chunkIndex: number;
  }>;
  toolCalls?: Array<{
    toolName: string;
    status: "success" | "failed";
  }>;
  isStreaming?: boolean;
}

export function useChat(workspaceId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();

  const sendMessage = useCallback(
    async (content: string) => {
      if (!workspaceId || !content.trim()) return;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: content.trim(),
      };

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsLoading(true);

      abortControllerRef.current = new AbortController();

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content.trim(),
            workspaceId,
            chatId: currentChatId,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!res.ok) {
          throw new Error(`Request failed: ${res.statusText}`);
        }

        const chatIdFromHeader = res.headers.get("X-Chat-Id");
        if (chatIdFromHeader && !currentChatId) {
          setCurrentChatId(chatIdFromHeader);
          queryClient.invalidateQueries({ queryKey: ["chats", workspaceId] });
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let finalSources: ChatMessage["sources"] = [];
        const toolCallsExecuted: ChatMessage["toolCalls"] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = JSON.parse(line.slice(6));

            if (data.type === "text") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id
                    ? { ...m, content: m.content + data.content }
                    : m
                )
              );
            } else if (data.type === "tool_call") {
              toast.info(`Running tool: ${data.toolName}...`);
            } else if (data.type === "tool_result") {
              toolCallsExecuted.push({
                toolName: data.toolName,
                status: data.success ? "success" : "failed",
              });
              if (data.success) {
                toast.success(data.message || `Tool ${data.toolName} succeeded`);
              } else {
                toast.error(`Tool ${data.toolName} failed`);
              }
              queryClient.invalidateQueries({ queryKey: ["tool-logs", workspaceId] });
            } else if (data.type === "done") {
              finalSources = data.sources;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id
                    ? {
                        ...m,
                        isStreaming: false,
                        sources: finalSources,
                        toolCalls: toolCallsExecuted,
                      }
                    : m
                )
              );
              queryClient.invalidateQueries({ queryKey: ["chats", workspaceId] });
            } else if (data.type === "error") {
              throw new Error(data.message);
            }
          }
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        toast.error((error as Error).message || "Something went wrong");
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? {
                  ...m,
                  content: "Sorry, something went wrong. Please try again.",
                  isStreaming: false,
                }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [workspaceId, currentChatId, queryClient]
  );

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
    setMessages((prev) =>
      prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m))
    );
  }, []);

  const resetChat = useCallback(() => {
    setMessages([]);
    setCurrentChatId(null);
  }, []);

  return {
    messages,
    isLoading,
    currentChatId,
    sendMessage,
    stopGeneration,
    resetChat,
    setCurrentChatId,
    setMessages,
  };
}
