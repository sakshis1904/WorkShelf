"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquare, AlertCircle } from "lucide-react";
import { useWorkspaces } from "@/hooks/use-workspace";
import { useChat } from "@/hooks/use-chat";
import { Header } from "@/components/dashboard/header";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatMessage } from "@/hooks/use-chat";

export default function ChatPage() {
  const { activeWorkspaceId, activeWorkspace } = useWorkspaces();
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

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSelectChat(chatId: string, historicMessages: ChatMessage[]) {
    setCurrentChatId(chatId);
    setMessages(historicMessages);
  }

  function handleNewChat() {
    resetChat();
  }

  const hasDocuments = (activeWorkspace?.documentsCount ?? 0) > 0;

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Chat Sidebar */}
      {activeWorkspaceId && (
        <ChatSidebar
          workspaceId={activeWorkspaceId}
          activeChatId={currentChatId}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Chat"
          description="Ask questions about your uploaded documents"
        />

        {!activeWorkspaceId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400">Select a workspace to start chatting.</p>
            </div>
          </div>
        ) : !hasDocuments && messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-sm">
              <MessageSquare className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-white font-medium mb-2">No documents yet</h3>
              <p className="text-zinc-400 text-sm">
                Upload documents to your workspace first. The AI will answer only from your
                uploaded content.
              </p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="h-14 w-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-7 w-7 text-indigo-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Ask Your Documents</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Ask any question about your uploaded documents. The AI uses RAG to retrieve
                relevant context and provide cited answers.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {[
                  "What are the key findings?",
                  "Summarize the main points",
                  "What does the report say about...?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => sendMessage(suggestion)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6 max-w-4xl mx-auto">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
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
          placeholder={
            !activeWorkspaceId
              ? "Select a workspace first..."
              : "Ask a question about your documents..."
          }
        />
      </div>
    </div>
  );
}
