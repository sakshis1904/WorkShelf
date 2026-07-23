"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Bug, Search, Loader2, FileText, Hash } from "lucide-react";
import { useWorkspaces } from "@/hooks/use-workspace";
import { Header } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

interface DebugResult {
  workspaceId: string;
  query: string;
  chunks: Array<{
    chunkId: string;
    documentId: string;
    documentName: string;
    content: string;
    score: number;
    chunkIndex: number;
    metadata: { page?: number; source: string; startChar?: number; endChar?: number };
  }>;
  latencyMs: number;
  totalRetrieved: number;
}

export default function DebugPage() {
  const { activeWorkspaceId } = useWorkspaces();
  const [query, setQuery] = useState("");
  const [topK, setTopK] = useState([5]);
  const [result, setResult] = useState<DebugResult | null>(null);

  const debugMutation = useMutation({
    mutationFn: async () => {
      if (!activeWorkspaceId) throw new Error("No workspace selected");
      const res = await fetch("/api/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, workspaceId: activeWorkspaceId, topK: topK[0] }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Debug failed");
      return json.data as DebugResult;
    },
    onSuccess: (data) => {
      setResult(data);
      toast.success(`Retrieved ${data.totalRetrieved} chunks in ${data.latencyMs}ms`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleDebug(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    debugMutation.mutate();
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <Header
        title="Retrieval Debug"
        description="Test the RAG pipeline and inspect retrieved chunks"
      />

      <div className="p-6 space-y-6">
        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 text-sm text-blue-300">
          <Bug className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-blue-200">Retrieval Debugger</strong>
            <p className="text-blue-400 mt-0.5">
              This tool runs a vector search query against your workspace and shows which chunks would
              be retrieved, along with similarity scores, chunk metadata, and latency.
            </p>
          </div>
        </div>

        {/* Workspace ID display */}
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-900 border border-white/10 text-sm">
          <Hash className="h-4 w-4 text-zinc-500" />
          <span className="text-zinc-400">Workspace ID:</span>
          <code className="text-indigo-300 font-mono text-xs">{activeWorkspaceId ?? "—"}</code>
        </div>

        {/* Query Form */}
        <form onSubmit={handleDebug} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-zinc-300">Test Query</Label>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter a test query to see what chunks get retrieved..."
              className="bg-zinc-900 border-white/10 text-zinc-200 placeholder:text-zinc-600"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Top K = {topK[0]}</Label>
            <div className="px-1">
              <Slider
                value={topK}
                onValueChange={setTopK}
                min={1}
                max={20}
                step={1}
                className="w-full"
              />
            </div>
            <p className="text-xs text-zinc-500">Number of chunks to retrieve (1–20)</p>
          </div>

          <Button
            type="submit"
            disabled={!query.trim() || !activeWorkspaceId || debugMutation.isPending}
            className="bg-indigo-500 hover:bg-indigo-600"
          >
            {debugMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Retrieving...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Run Vector Search
              </>
            )}
          </Button>
        </form>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Summary */}
              <div className="flex flex-wrap gap-4 p-4 rounded-xl border border-white/10 bg-zinc-900/60">
                <div>
                  <p className="text-xs text-zinc-500">Query</p>
                  <p className="text-sm text-zinc-200 font-medium">{result.query}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Retrieved</p>
                  <p className="text-sm text-zinc-200 font-medium">{result.totalRetrieved} chunks</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Latency</p>
                  <p className="text-sm text-zinc-200 font-medium">{result.latencyMs}ms</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Workspace</p>
                  <p className="text-xs text-indigo-300 font-mono">{result.workspaceId}</p>
                </div>
              </div>

              {result.chunks.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-sm">
                  No chunks retrieved. Try a different query or upload more documents.
                </div>
              ) : (
                <div className="space-y-3">
                  {result.chunks.map((chunk, idx) => (
                    <motion.div
                      key={chunk.chunkId}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="rounded-xl border border-white/10 bg-zinc-900/60 overflow-hidden"
                    >
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
                        <span className="text-xs font-mono text-zinc-500">#{idx + 1}</span>
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-blue-400" />
                          <span className="text-sm font-medium text-zinc-200">{chunk.documentName}</span>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                          <Badge variant="outline" className="text-xs border-indigo-500/30 text-indigo-400">
                            Score: {(chunk.score * 100).toFixed(1)}%
                          </Badge>
                          <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400">
                            Chunk {chunk.chunkIndex + 1}
                          </Badge>
                          {chunk.metadata.page && (
                            <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400">
                              Page {chunk.metadata.page}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="p-4 space-y-3">
                        <div>
                          <p className="text-xs text-zinc-500 mb-1.5 uppercase tracking-wide font-medium">Content</p>
                          <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950 rounded-lg p-3 whitespace-pre-wrap font-mono">
                            {chunk.content}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-white/5">
                          <div>
                            <p className="text-xs text-zinc-500">Chunk ID</p>
                            <p className="text-xs text-zinc-400 font-mono truncate">{chunk.chunkId}</p>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-500">Document ID</p>
                            <p className="text-xs text-zinc-400 font-mono truncate">{chunk.documentId}</p>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-500">Source</p>
                            <p className="text-xs text-zinc-400 truncate">{chunk.metadata.source}</p>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-500">Start Char</p>
                            <p className="text-xs text-zinc-400">{chunk.metadata.startChar ?? "—"}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
