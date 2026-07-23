"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Wrench,
  Bug,
  Settings,
  User,
  BookOpen,
  ChevronDown,
  Plus,
  Loader2,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useWorkspaces } from "@/hooks/use-workspace";
import { WorkspaceSwitcher } from "./workspace-switcher";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: FileText, label: "Documents", href: "/dashboard/documents" },
  { icon: MessageSquare, label: "Chat", href: "/dashboard/chat" },
  { icon: Wrench, label: "Tool Logs", href: "/dashboard/tool-logs" },
  { icon: Bug, label: "Debug", href: "/dashboard/debug" },
];

const bottomNavItems = [
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  { icon: User, label: "Profile", href: "/dashboard/profile" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { activeWorkspace, isLoading } = useWorkspaces();

  return (
    <aside className="flex h-full w-64 flex-col bg-zinc-950 border-r border-white/10">
      {/* Logo */}
      <div className="flex items-center gap-2 p-4 border-b border-white/10">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
          <BookOpen className="h-4 w-4 text-white" />
        </div>
        <span className="font-bold text-white">WorkShelf</span>
      </div>

      {/* Workspace Switcher */}
      <div className="p-3 border-b border-white/10">
        <WorkspaceSwitcher />
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-indigo-500/20 text-indigo-300"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                  {item.label === "Documents" && activeWorkspace && (
                    <Badge
                      variant="secondary"
                      className="ml-auto text-xs bg-zinc-800 text-zinc-400"
                    >
                      {activeWorkspace.documentsCount}
                    </Badge>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <Separator className="my-3 bg-white/10" />

        <nav className="space-y-1">
          {bottomNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-indigo-500/20 text-indigo-300"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User */}
      <div className="p-3 border-t border-white/10 flex items-center gap-3">
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
            },
          }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-zinc-400 truncate">
            {activeWorkspace?.name ?? "No workspace"}
          </p>
        </div>
      </div>
    </aside>
  );
}
