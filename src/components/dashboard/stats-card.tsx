"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  color?: string;
  isLoading?: boolean;
  delay?: number;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  color = "text-indigo-400",
  isLoading,
  delay = 0,
}: StatsCardProps) {
  if (isLoading) {
    return (
      <div className="p-5 rounded-xl border border-white/10 bg-zinc-900/60">
        <Skeleton className="h-4 w-24 bg-zinc-800 mb-3" />
        <Skeleton className="h-8 w-16 bg-zinc-800 mb-1" />
        <Skeleton className="h-3 w-32 bg-zinc-800" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="p-5 rounded-xl border border-white/10 bg-zinc-900/60 hover:bg-zinc-900 transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-zinc-400">{title}</span>
        <Icon className={cn("h-4 w-4", color)} />
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      {description && <p className="text-xs text-zinc-500">{description}</p>}
    </motion.div>
  );
}
