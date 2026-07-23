"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  Check,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useWorkspaces } from "@/hooks/use-workspace";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CreateSchema = z.object({
  name: z.string().min(1, "Name required").max(100),
  description: z.string().max(500).optional(),
});

const WORKSPACE_COLORS = [
  "#6366f1", "#8b5cf6", "#d946ef", "#ec4899",
  "#ef4444", "#f97316", "#f59e0b", "#22c55e",
  "#14b8a6", "#0ea5e9", "#a855f7",
];

export function WorkspaceSwitcher() {
  const {
    workspaces,
    isLoading,
    activeWorkspace,
    switchWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    isCreating,
  } = useWorkspaces();

  const [open, setOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(WORKSPACE_COLORS[0]);
  const [editingWorkspace, setEditingWorkspace] = useState<string | null>(null);

  const form = useForm<z.infer<typeof CreateSchema>>({ resolver: zodResolver(CreateSchema) });
  const editForm = useForm<z.infer<typeof CreateSchema>>({ resolver: zodResolver(CreateSchema) });

  function handleCreate(data: z.infer<typeof CreateSchema>) {
    createWorkspace({ ...data, color: selectedColor });
    setCreateDialogOpen(false);
    form.reset();
  }

  function handleEdit(data: z.infer<typeof CreateSchema>) {
    if (!editingWorkspace) return;
    updateWorkspace({ id: editingWorkspace, ...data });
    setEditDialogOpen(false);
  }

  function openEditDialog(ws: (typeof workspaces)[0]) {
    setEditingWorkspace(ws._id);
    editForm.setValue("name", ws.name);
    editForm.setValue("description", ws.description ?? "");
    setEditDialogOpen(true);
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
        <span className="text-sm text-zinc-500">Loading...</span>
      </div>
    );
  }

  return (
    <>
      {/* Switcher Button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
      >
        {activeWorkspace ? (
          <>
            <div
              className="h-5 w-5 rounded-md flex-shrink-0"
              style={{ backgroundColor: activeWorkspace.color }}
            />
            <span className="text-sm font-medium text-white flex-1 text-left truncate">
              {activeWorkspace.name}
            </span>
          </>
        ) : (
          <>
            <FolderOpen className="h-5 w-5 text-zinc-500" />
            <span className="text-sm text-zinc-500 flex-1 text-left">No workspace</span>
          </>
        )}
        <ChevronDown
          className={cn("h-4 w-4 text-zinc-400 transition-transform", open && "rotate-180")}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900 shadow-xl overflow-hidden"
          >
            <div className="p-1 max-h-60 overflow-y-auto">
              {workspaces.map((ws) => (
                <div
                  key={ws._id}
                  className={cn(
                    "group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors",
                    ws._id === activeWorkspace?._id && "bg-indigo-500/10"
                  )}
                >
                  <button
                    className="flex items-center gap-2 flex-1 text-left"
                    onClick={() => {
                      switchWorkspace(ws._id);
                      setOpen(false);
                    }}
                  >
                    <div
                      className="h-5 w-5 rounded-md flex-shrink-0"
                      style={{ backgroundColor: ws.color }}
                    />
                    <span className="text-sm text-zinc-300 truncate">{ws.name}</span>
                    {ws._id === activeWorkspace?._id && (
                      <Check className="h-3.5 w-3.5 text-indigo-400 ml-auto flex-shrink-0" />
                    )}
                  </button>
                  <div className="hidden group-hover:flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(ws);
                        setOpen(false);
                      }}
                      className="p-1 rounded hover:bg-white/10 text-zinc-500 hover:text-white"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingWorkspace(ws._id);
                        setDeleteDialogOpen(true);
                        setOpen(false);
                      }}
                      className="p-1 rounded hover:bg-red-500/20 text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 p-1">
              <button
                onClick={() => {
                  setCreateDialogOpen(true);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-indigo-400 hover:bg-indigo-500/10 transition-colors"
              >
                <Plus className="h-4 w-4" />
                New Workspace
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Create Workspace</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                {...form.register("name")}
                placeholder="My Workspace"
                className="bg-zinc-800 border-white/10 text-white"
              />
              {form.formState.errors.name && (
                <p className="text-xs text-red-400">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input
                {...form.register("description")}
                placeholder="What this workspace is for..."
                className="bg-zinc-800 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {WORKSPACE_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      "h-6 w-6 rounded-full transition-all",
                      selectedColor === color && "ring-2 ring-white ring-offset-2 ring-offset-zinc-900"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating} className="bg-indigo-500 hover:bg-indigo-600">
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Rename Workspace</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                {...editForm.register("name")}
                className="bg-zinc-800 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                {...editForm.register("description")}
                className="bg-zinc-800 border-white/10 text-white"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-500 hover:bg-indigo-600">
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workspace?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This will permanently delete the workspace and all its documents, chats, tasks, and
              tool logs. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-white/10 text-white hover:bg-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => {
                if (editingWorkspace) deleteWorkspace(editingWorkspace);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
