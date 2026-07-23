"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MessageSquare, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatMessage } from "@/hooks/use-chat";

interface Chat {
  _id: string;
  title: string;
  messageCount: number;
  updatedAt: string;
}

interface ChatSidebarProps {
  workspaceId: string;
  activeChatId: string | null;
  onSelectChat: (chatId: string, messages: ChatMessage[]) => void;
  onNewChat: () => void;
}

interface RawChatMessage {
  _id: string;
  role: "user" | "assistant";
  content: string;
  sources?: unknown[];
  toolCalls?: unknown[];
}

export function ChatSidebar({
  workspaceId,
  activeChatId,
  onSelectChat,
  onNewChat,
}: ChatSidebarProps) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["chats", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/chat?workspaceId=${workspaceId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    enabled: !!workspaceId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (chatId: string) => {
      const res = await fetch(`/api/chat/${chatId}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats", workspaceId] });
      toast.success("Chat deleted");
      if (activeChatId) onNewChat();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  async function handleSelectChat(chatId: string) {
    const res = await fetch(`/api/chat/${chatId}`);
    const json = await res.json();
    if (!json.success) {
      toast.error("Failed to load chat");
      return;
    }
    const msgs = json.data.messages.map((m: RawChatMessage) => ({
      id: m._id,
      role: m.role,
      content: m.content,
      sources: m.sources,
      toolCalls: m.toolCalls,
    }));
    onSelectChat(chatId, msgs);
  }

  const chats: Chat[] = data?.chats ?? [];

  return (
    <div className="w-64 flex-shrink-0 flex flex-col border-r border-white/10 bg-zinc-950">
      <div className="p-3 border-b border-white/10">
        <Button
          onClick={onNewChat}
          size="sm"
          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white justify-start gap-2"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
          </div>
        ) : chats.length === 0 ? (
          <div className="p-4 text-center text-xs text-zinc-500">
            No chats yet. Start a new one!
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {chats.map((chat) => (
              <motion.div
                key={chat._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                  "group flex items-start gap-2 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-white/5 transition-colors",
                  activeChatId === chat._id && "bg-indigo-500/10"
                )}
                onClick={() => handleSelectChat(chat._id)}
              >
                <MessageSquare className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-xs font-medium truncate",
                      activeChatId === chat._id ? "text-indigo-300" : "text-zinc-300"
                    )}
                  >
                    {chat.title}
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">
                    {formatRelativeTime(chat.updatedAt)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMutation.mutate(chat._id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-zinc-600 hover:text-red-400 transition-all"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
