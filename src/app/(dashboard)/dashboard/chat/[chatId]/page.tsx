"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWorkspaces } from "@/hooks/use-workspace";
import { useChat } from "@/hooks/use-chat";
import { Header } from "@/components/dashboard/header";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { ChatMessage } from "@/hooks/use-chat";
import { useRef } from "react";

export default function ChatDetailPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = use(params);
  const router = useRouter();
  const { activeWorkspaceId } = useWorkspaces();
  const {
    messages,
    isLoading,
    currentChatId,
    sendMessage,
    stopGeneration,
    resetChat,
    setCurrentChatId,
    setMessages,
  } = useChat(activeWorkspaceId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  // Load chat history on mount
  useEffect(() => {
    if (initialized.current || !chatId) return;
    initialized.current = true;

    fetch(`/api/chat/${chatId}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) {
          toast.error("Failed to load chat");
          router.push("/dashboard/chat");
          return;
        }
        const msgs: ChatMessage[] = json.data.messages.map(
          (m: { _id: string; role: "user" | "assistant"; content: string; sources?: unknown[]; toolCalls?: unknown[] }) => ({
            id: m._id,
            role: m.role,
            content: m.content,
            sources: m.sources,
            toolCalls: m.toolCalls,
          })
        );
        setMessages(msgs);
        setCurrentChatId(chatId);
      })
      .catch(() => {
        toast.error("Failed to load chat");
        router.push("/dashboard/chat");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSelectChat(id: string, historicMessages: ChatMessage[]) {
    setCurrentChatId(id);
    setMessages(historicMessages);
    router.push(`/dashboard/chat/${id}`);
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {activeWorkspaceId && (
        <ChatSidebar
          workspaceId={activeWorkspaceId}
          activeChatId={currentChatId}
          onSelectChat={handleSelectChat}
          onNewChat={() => {
            resetChat();
            router.push("/dashboard/chat");
          }}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Chat" description="Continue your conversation" />

        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="space-y-3 w-full max-w-lg px-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full bg-zinc-800 rounded-xl" />
              ))}
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6 max-w-4xl mx-auto">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>
        )}

        <ChatInput
          onSend={sendMessage}
          onStop={stopGeneration}
          isLoading={isLoading}
          disabled={!activeWorkspaceId}
        />
      </div>
    </div>
  );
}
