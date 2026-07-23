"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  FileText,
  Trash2,
  RefreshCw,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useWorkspaces } from "@/hooks/use-workspace";
import { Header } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UploadDropzone } from "@/lib/uploadthing";
import { formatBytes, formatRelativeTime } from "@/lib/utils";

interface Document {
  _id: string;
  name: string;
  fileType: string;
  fileSize: number;
  status: "processing" | "ready" | "failed";
  chunksCount: number;
  errorMessage?: string;
  createdAt: string;
}

const statusConfig = {
  ready: { icon: CheckCircle, label: "Ready", color: "text-green-400", badge: "border-green-500/30 text-green-400" },
  processing: { icon: Clock, label: "Processing", color: "text-yellow-400", badge: "border-yellow-500/30 text-yellow-400" },
  failed: { icon: XCircle, label: "Failed", color: "text-red-400", badge: "border-red-500/30 text-red-400" },
};

export default function DocumentsPage() {
  const { activeWorkspaceId, isLoading: workspaceLoading } = useWorkspaces();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["documents", activeWorkspaceId, page],
    queryFn: async () => {
      if (!activeWorkspaceId) return null;
      const res = await fetch(`/api/documents?workspaceId=${activeWorkspaceId}&page=${page}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    enabled: !!activeWorkspaceId,
    refetchInterval: 5000, // Poll for processing documents
  });

  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const res = await fetch(`/api/documents/${documentId}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", activeWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ["workspace-detail", activeWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      toast.success("Document deleted");
      setDeleteId(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const resetStuckMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/documents?action=reset-stuck`, { method: "PATCH" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["documents", activeWorkspaceId] });
      toast.success(data.message);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const documents: Document[] = data?.documents ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Documents" description="Upload and manage your workspace documents" />

      <div className="p-6 space-y-6">
        {/* Upload Zone */}
        <div className="rounded-xl border border-dashed border-white/20 bg-zinc-900/40 p-6">
          <div className="text-center mb-4">
            <Upload className="h-8 w-8 text-zinc-500 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-zinc-300">Upload Documents</h3>
            <p className="text-xs text-zinc-500 mt-1">
              PDF, DOCX, TXT, MD, CSV — up to 10MB each
            </p>
          </div>

          {activeWorkspaceId ? (
            <UploadDropzone
              endpoint="documentUploader"
              input={{ workspaceId: activeWorkspaceId }}
              onClientUploadComplete={() => {
                toast.success("Upload complete! Processing...");
                setTimeout(() => {
                  queryClient.invalidateQueries({ queryKey: ["documents", activeWorkspaceId] });
                  queryClient.invalidateQueries({ queryKey: ["workspaces"] });
                }, 1000);
              }}
              onUploadError={(err) => {
                toast.error(`Upload failed: ${err.message}`);
              }}
              appearance={{
                container:
                  "border-0 bg-transparent ut-uploading:cursor-not-allowed",
                uploadIcon: "hidden",
                label: "text-zinc-400 hover:text-indigo-300 transition-colors",
                allowedContent: "text-zinc-600 text-xs",
                button:
                  "bg-indigo-500 hover:bg-indigo-600 text-white ut-uploading:bg-indigo-700 ut-uploading:opacity-80",
              }}
            />
          ) : (
            <p className="text-center text-sm text-zinc-500">
              Select a workspace to upload documents
            </p>
          )}
        </div>

        {/* Documents List */}
        <div className="rounded-xl border border-white/10 bg-zinc-900/60 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h2 className="text-sm font-semibold text-white">
              {documents.length > 0 ? `${data?.total ?? 0} Documents` : "Documents"}
            </h2>
            <div className="flex items-center gap-2">
              {documents.some((d) => d.status === "processing") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => resetStuckMutation.mutate()}
                  disabled={resetStuckMutation.isPending}
                  className="text-xs text-yellow-400 hover:text-yellow-300 gap-1"
                  title="Mark stuck documents as failed so you can re-upload"
                >
                  <AlertCircle className="h-3 w-3" />
                  Reset stuck
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                className="text-zinc-400 hover:text-white"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {isLoading || workspaceLoading ? (
            <div className="divide-y divide-white/5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-5 py-4 flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-lg bg-zinc-800" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-56 bg-zinc-800" />
                    <Skeleton className="h-3 w-32 bg-zinc-800" />
                  </div>
                  <Skeleton className="h-6 w-20 bg-zinc-800" />
                </div>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <AlertCircle className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">No documents yet. Upload your first one above.</p>
            </div>
          ) : (
            <AnimatePresence>
              <div className="divide-y divide-white/5">
                {documents.map((doc, idx) => {
                  const status = statusConfig[doc.status];
                  const StatusIcon = status.icon;
                  return (
                    <motion.div
                      key={doc._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.04 }}
                      className="px-5 py-4 flex items-center gap-4 hover:bg-white/5 transition-colors group"
                    >
                      <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-200 truncate">{doc.name}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-zinc-500">
                          <span>{formatBytes(doc.fileSize)}</span>
                          {doc.chunksCount > 0 && (
                            <span>{doc.chunksCount} chunks</span>
                          )}
                          <span>{formatRelativeTime(doc.createdAt)}</span>
                        </div>
                        {doc.status === "failed" && doc.errorMessage && (
                          <p className="text-xs text-red-400 mt-1 truncate">{doc.errorMessage}</p>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs flex items-center gap-1 ${status.badge}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        onClick={() => setDeleteId(doc._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 px-5 py-3 border-t border-white/10">
              <Button
                variant="ghost"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="text-zinc-400"
              >
                Previous
              </Button>
              <span className="text-xs text-zinc-500">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="text-zinc-400"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-zinc-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This will permanently delete the document and all its stored chunks and embeddings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-white/10 text-white hover:bg-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
