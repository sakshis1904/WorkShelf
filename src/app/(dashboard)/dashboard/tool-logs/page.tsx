"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import { useWorkspaces } from "@/hooks/use-workspace";
import { Header } from "@/components/dashboard/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/utils";

interface ToolLog {
  _id: string;
  toolName: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  status: "pending" | "success" | "failed";
  errorMessage?: string;
  executionMs?: number;
  createdAt: string;
}

const statusConfig = {
  success: { icon: CheckCircle, color: "text-green-400", badge: "border-green-500/30 text-green-400 bg-green-500/5" },
  failed: { icon: XCircle, color: "text-red-400", badge: "border-red-500/30 text-red-400 bg-red-500/5" },
  pending: { icon: Clock, color: "text-yellow-400", badge: "border-yellow-500/30 text-yellow-400 bg-yellow-500/5" },
};

function ToolLogRow({ log }: { log: ToolLog }) {
  const [expanded, setExpanded] = useState(false);
  const status = statusConfig[log.status];
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="border-b border-white/5 last:border-0"
    >
      <button
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="h-9 w-9 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
          <Wrench className="h-4 w-4 text-orange-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-200">{log.toolName}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{formatRelativeTime(log.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          {log.executionMs && (
            <span className="text-xs text-zinc-500">{log.executionMs}ms</span>
          )}
          <Badge variant="outline" className={`text-xs flex items-center gap-1 ${status.badge}`}>
            <StatusIcon className="h-3 w-3" />
            {log.status}
          </Badge>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-zinc-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-zinc-500" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wide">Input</p>
                <pre className="text-xs text-zinc-300 bg-zinc-900 rounded-lg p-3 overflow-x-auto">
                  {JSON.stringify(log.input, null, 2)}
                </pre>
              </div>
              {log.output ? (
                <div>
                  <p className="text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wide">Output</p>
                  <pre className="text-xs text-zinc-300 bg-zinc-900 rounded-lg p-3 overflow-x-auto">
                    {JSON.stringify(log.output, null, 2)}
                  </pre>
                </div>
              ) : log.errorMessage ? (
                <div>
                  <p className="text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wide">Error</p>
                  <p className="text-xs text-red-400 bg-red-500/5 rounded-lg p-3 border border-red-500/20">
                    {log.errorMessage}
                  </p>
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ToolLogsPage() {
  const { activeWorkspaceId } = useWorkspaces();
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["tool-logs", activeWorkspaceId, page],
    queryFn: async () => {
      if (!activeWorkspaceId) return null;
      const res = await fetch(`/api/tools?workspaceId=${activeWorkspaceId}&page=${page}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    enabled: !!activeWorkspaceId,
  });

  const logs: ToolLog[] = data?.logs ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Tool Logs" description="History of all AI tool executions" />

      <div className="p-6">
        <div className="rounded-xl border border-white/10 bg-zinc-900/60 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h2 className="text-sm font-semibold text-white">
              {data?.total ?? 0} Tool Executions
            </h2>
            <Button variant="ghost" size="sm" onClick={() => refetch()} className="text-zinc-400">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>

          {isLoading ? (
            <div className="divide-y divide-white/5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-5 py-4 flex items-center gap-4">
                  <Skeleton className="h-9 w-9 rounded-lg bg-zinc-800" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40 bg-zinc-800" />
                    <Skeleton className="h-3 w-24 bg-zinc-800" />
                  </div>
                  <Skeleton className="h-6 w-20 bg-zinc-800" />
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Wrench className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">
                No tool executions yet. Ask the AI to save a task or send a summary.
              </p>
            </div>
          ) : (
            <div>
              {logs.map((log) => (
                <ToolLogRow key={log._id} log={log} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 px-5 py-3 border-t border-white/10">
              <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="text-zinc-400">
                Previous
              </Button>
              <span className="text-xs text-zinc-500">Page {page} of {totalPages}</span>
              <Button variant="ghost" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="text-zinc-400">
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
