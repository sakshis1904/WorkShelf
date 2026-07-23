"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2, Settings, Palette, Trash2, Shield } from "lucide-react";
import { useWorkspaces } from "@/hooks/use-workspace";
import { Header } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
import { ThemeToggle } from "@/components/theme-toggle";

const WorkspaceSchema = z.object({
  name: z.string().min(1, "Name required").max(100),
  description: z.string().max(500).optional(),
});

const WORKSPACE_COLORS = [
  "#6366f1", "#8b5cf6", "#d946ef", "#ec4899",
  "#ef4444", "#f97316", "#f59e0b", "#22c55e",
  "#14b8a6", "#0ea5e9",
];

export default function SettingsPage() {
  const { activeWorkspace, activeWorkspaceId, updateWorkspace, deleteWorkspace, isUpdating } =
    useWorkspaces();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(activeWorkspace?.color ?? WORKSPACE_COLORS[0]);

  const form = useForm({
    resolver: zodResolver(WorkspaceSchema),
    values: {
      name: activeWorkspace?.name ?? "",
      description: activeWorkspace?.description ?? "",
    },
  });

  function handleSave(data: z.infer<typeof WorkspaceSchema>) {
    if (!activeWorkspaceId) return;
    updateWorkspace({ id: activeWorkspaceId, ...data, color: selectedColor });
  }

  function handleDelete() {
    if (!activeWorkspaceId) return;
    deleteWorkspace(activeWorkspaceId);
    setDeleteDialogOpen(false);
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Settings" description="Manage workspace and application settings" />

      <div className="p-6 max-w-2xl space-y-8">
        {/* Workspace Settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-white/10 bg-zinc-900/60 overflow-hidden"
        >
          <div className="flex items-center gap-2 px-5 py-4 border-b border-white/10">
            <Settings className="h-4 w-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-white">Workspace Settings</h2>
          </div>

          {activeWorkspace ? (
            <form onSubmit={form.handleSubmit(handleSave)} className="p-5 space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Name</Label>
                <Input
                  {...form.register("name")}
                  className="bg-zinc-800 border-white/10 text-white"
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-red-400">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Description</Label>
                <Textarea
                  {...form.register("description")}
                  placeholder="What this workspace is for..."
                  className="bg-zinc-800 border-white/10 text-white resize-none"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {WORKSPACE_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`h-7 w-7 rounded-full transition-all ${selectedColor === color ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900" : ""}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                disabled={isUpdating}
                className="bg-indigo-500 hover:bg-indigo-600"
              >
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </form>
          ) : (
            <div className="p-5 text-sm text-zinc-500">No workspace selected.</div>
          )}
        </motion.div>

        {/* Appearance */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-white/10 bg-zinc-900/60 overflow-hidden"
        >
          <div className="flex items-center gap-2 px-5 py-4 border-b border-white/10">
            <Palette className="h-4 w-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-white">Appearance</h2>
          </div>
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-300">Theme</p>
              <p className="text-xs text-zinc-500 mt-0.5">Toggle between light and dark mode</p>
            </div>
            <ThemeToggle />
          </div>
        </motion.div>

        {/* Security Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl border border-white/10 bg-zinc-900/60 overflow-hidden"
        >
          <div className="flex items-center gap-2 px-5 py-4 border-b border-white/10">
            <Shield className="h-4 w-4 text-green-400" />
            <h2 className="text-sm font-semibold text-white">Security</h2>
          </div>
          <div className="p-5 space-y-3 text-sm text-zinc-400">
            <p>✅ Workspace Isolation: Enabled — queries never cross workspace boundaries</p>
            <p>✅ Prompt Injection: Protected — documents treated as data only</p>
            <p>✅ Server-side Validation: All inputs validated with Zod</p>
            <p>✅ Authentication: Clerk — all routes require authentication</p>
          </div>
        </motion.div>

        {/* Danger Zone */}
        {activeWorkspace && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-red-500/20 bg-red-500/5 overflow-hidden"
          >
            <div className="flex items-center gap-2 px-5 py-4 border-b border-red-500/20">
              <Trash2 className="h-4 w-4 text-red-400" />
              <h2 className="text-sm font-semibold text-red-300">Danger Zone</h2>
            </div>
            <div className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-300">Delete Workspace</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Permanently deletes this workspace, all documents, chats, and data.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete Workspace
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workspace?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This will permanently delete <strong>{activeWorkspace?.name}</strong> and all its
              documents, chats, tasks, and tool logs. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-white/10 text-white hover:bg-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
