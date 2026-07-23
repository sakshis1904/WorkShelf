"use client";

import { useQuery } from "@tanstack/react-query";
import { useWorkspaces } from "@/hooks/use-workspace";
import { Header } from "@/components/dashboard/header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { formatBytes, formatRelativeTime } from "@/lib/utils";
import {
  FileText,
  MessageSquare,
  Wrench,
  CheckSquare,
  HardDrive,
  Upload,
  ArrowRight,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const { activeWorkspaceId, activeWorkspace, isLoading: workspaceLoading } = useWorkspaces();

  const { data: workspaceData, isLoading: statsLoading } = useQuery({
    queryKey: ["workspace-detail", activeWorkspaceId],
    queryFn: async () => {
      if (!activeWorkspaceId) return null;
      const res = await fetch(`/api/workspaces/${activeWorkspaceId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    enabled: !!activeWorkspaceId,
  });

  const { data: docsData, isLoading: docsLoading } = useQuery({
    queryKey: ["documents", activeWorkspaceId],
    queryFn: async () => {
      if (!activeWorkspaceId) return null;
      const res = await fetch(`/api/documents?workspaceId=${activeWorkspaceId}&page=1`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    enabled: !!activeWorkspaceId,
  });

  const { data: chatsData, isLoading: chatsLoading } = useQuery({
    queryKey: ["chats", activeWorkspaceId],
    queryFn: async () => {
      if (!activeWorkspaceId) return null;
      const res = await fetch(`/api/chat?workspaceId=${activeWorkspaceId}&page=1`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    enabled: !!activeWorkspaceId,
  });

  const isLoading = workspaceLoading || statsLoading;
  const stats = workspaceData?.stats;

  if (!activeWorkspaceId && !workspaceLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">No workspace selected. Create one to get started.</p>
          <Link href="/dashboard">
            <Button className="bg-indigo-500 hover:bg-indigo-600">Create Workspace</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <Header
        title="Dashboard"
        description="Overview of your workspace activity"
      />

      <div className="p-6 space-y-6">
        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatsCard
            title="Documents"
            value={stats?.totalDocuments ?? 0}
            icon={FileText}
            color="text-blue-400"
            isLoading={isLoading}
            delay={0}
          />
          <StatsCard
            title="Chats"
            value={stats?.totalChats ?? 0}
            icon={MessageSquare}
            color="text-indigo-400"
            isLoading={isLoading}
            delay={0.05}
          />
          <StatsCard
            title="Messages"
            value={stats?.totalMessages ?? 0}
            icon={MessageSquare}
            color="text-purple-400"
            isLoading={isLoading}
            delay={0.1}
          />
          <StatsCard
            title="Tasks"
            value={stats?.totalTasks ?? 0}
            icon={CheckSquare}
            color="text-green-400"
            isLoading={isLoading}
            delay={0.15}
          />
          <StatsCard
            title="Tool Runs"
            value={stats?.totalToolExecutions ?? 0}
            icon={Wrench}
            color="text-orange-400"
            isLoading={isLoading}
            delay={0.2}
          />
          <StatsCard
            title="Storage"
            value={formatBytes(stats?.storageUsedBytes ?? 0)}
            icon={HardDrive}
            color="text-yellow-400"
            isLoading={isLoading}
            delay={0.25}
          />
        </div>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Documents */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border border-white/10 bg-zinc-900/60 overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-400" />
                <h2 className="text-sm font-semibold text-white">Recent Documents</h2>
              </div>
              <Link href="/dashboard/documents">
                <Button variant="ghost" size="sm" className="text-xs text-zinc-400">
                  View all <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
            <div className="divide-y divide-white/5">
              {docsLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="px-5 py-3 flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded bg-zinc-800" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-48 bg-zinc-800" />
                        <Skeleton className="h-3 w-24 bg-zinc-800" />
                      </div>
                    </div>
                  ))
                : docsData?.documents.length === 0
                ? (
                    <div className="px-5 py-8 text-center text-sm text-zinc-500">
                      No documents yet.{" "}
                      <Link href="/dashboard/documents" className="text-indigo-400 hover:underline">
                        Upload one
                      </Link>
                    </div>
                  )
                : docsData?.documents.slice(0, 5).map((doc: { _id: string; name: string; status: string; fileSize: number; createdAt: string }) => (
                    <div key={doc._id} className="px-5 py-3 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-300 truncate">{doc.name}</p>
                        <p className="text-xs text-zinc-500">
                          {formatBytes(doc.fileSize)} • {formatRelativeTime(doc.createdAt)}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          doc.status === "ready"
                            ? "border-green-500/30 text-green-400 text-xs"
                            : doc.status === "failed"
                            ? "border-red-500/30 text-red-400 text-xs"
                            : "border-yellow-500/30 text-yellow-400 text-xs"
                        }
                      >
                        {doc.status}
                      </Badge>
                    </div>
                  ))}
            </div>
          </motion.div>

          {/* Recent Chats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-xl border border-white/10 bg-zinc-900/60 overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-indigo-400" />
                <h2 className="text-sm font-semibold text-white">Recent Chats</h2>
              </div>
              <Link href="/dashboard/chat">
                <Button variant="ghost" size="sm" className="text-xs text-zinc-400">
                  View all <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
            <div className="divide-y divide-white/5">
              {chatsLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="px-5 py-3 space-y-1.5">
                      <Skeleton className="h-3.5 w-48 bg-zinc-800" />
                      <Skeleton className="h-3 w-24 bg-zinc-800" />
                    </div>
                  ))
                : chatsData?.chats.length === 0
                ? (
                    <div className="px-5 py-8 text-center text-sm text-zinc-500">
                      No chats yet.{" "}
                      <Link href="/dashboard/chat" className="text-indigo-400 hover:underline">
                        Start one
                      </Link>
                    </div>
                  )
                : chatsData?.chats.slice(0, 5).map((chat: { _id: string; title: string; messageCount: number; updatedAt: string }) => (
                    <Link key={chat._id} href={`/dashboard/chat/${chat._id}`}>
                      <div className="px-5 py-3 hover:bg-white/5 transition-colors">
                        <p className="text-sm text-zinc-300 truncate">{chat.title}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-zinc-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatRelativeTime(chat.updatedAt)}
                          </span>
                          <span>{chat.messageCount} messages</span>
                        </div>
                      </div>
                    </Link>
                  ))}
            </div>
          </motion.div>
        </div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap gap-3"
        >
          <Link href="/dashboard/documents">
            <Button
              variant="outline"
              className="border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </Link>
          <Link href="/dashboard/chat">
            <Button className="bg-indigo-500 hover:bg-indigo-600">
              <MessageSquare className="mr-2 h-4 w-4" />
              New Chat
            </Button>
          </Link>
          <Link href="/dashboard/debug">
            <Button
              variant="outline"
              className="border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white"
            >
              <Wrench className="mr-2 h-4 w-4" />
              Debug Retrieval
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
