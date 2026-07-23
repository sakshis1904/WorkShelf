"use client";

import { useWorkspaces } from "@/hooks/use-workspace";
import { ThemeToggle } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  const { activeWorkspace, isLoading } = useWorkspaces();

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
      <div>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        {description && <p className="text-sm text-zinc-400 mt-0.5">{description}</p>}
      </div>
      <div className="flex items-center gap-3">
        {isLoading ? (
          <Skeleton className="h-6 w-28 bg-zinc-800" />
        ) : activeWorkspace ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-sm text-zinc-300">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: activeWorkspace.color }}
            />
            {activeWorkspace.name}
          </div>
        ) : null}
        <ThemeToggle />
      </div>
    </div>
  );
}
