"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCallback, useEffect, useState } from "react";

export interface Workspace {
  _id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  isDefault: boolean;
  documentsCount: number;
  createdAt: string;
  updatedAt: string;
}

const ACTIVE_WORKSPACE_KEY = "workshelf_active_workspace";

export function useWorkspaces() {
  const queryClient = useQueryClient();
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  const { data: workspaces = [], isLoading } = useQuery<Workspace[]>({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const res = await fetch("/api/workspaces");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
  });

  // Restore active workspace from storage or default to first
  useEffect(() => {
    if (workspaces.length === 0) return;
    const stored = localStorage.getItem(ACTIVE_WORKSPACE_KEY);
    if (stored && workspaces.find((w) => w._id === stored)) {
      setActiveWorkspaceId(stored);
    } else {
      const defaultWs = workspaces.find((w) => w.isDefault) ?? workspaces[0];
      setActiveWorkspaceId(defaultWs._id);
    }
  }, [workspaces]);

  const switchWorkspace = useCallback(
    (workspaceId: string) => {
      setActiveWorkspaceId(workspaceId);
      localStorage.setItem(ACTIVE_WORKSPACE_KEY, workspaceId);
    },
    []
  );

  const activeWorkspace = workspaces.find((w) => w._id === activeWorkspaceId) ?? null;

  const createMutation = useMutation({
    mutationFn: async (input: { name: string; description?: string; color?: string }) => {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as Workspace;
    },
    onSuccess: (newWs) => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      switchWorkspace(newWs._id);
      toast.success("Workspace created");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: { id: string; name?: string; description?: string; color?: string; icon?: string }) => {
      const res = await fetch(`/api/workspaces/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      toast.success("Workspace updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/workspaces/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      toast.success("Workspace deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return {
    workspaces,
    isLoading,
    activeWorkspace,
    activeWorkspaceId,
    switchWorkspace,
    createWorkspace: createMutation.mutate,
    updateWorkspace: updateMutation.mutate,
    deleteWorkspace: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
