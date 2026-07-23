"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { BookOpen, Wrench, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/hooks/use-chat";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("flex gap-3", isUser && "flex-row-reverse")}
    >
      {/* Avatar */}
      <div
        className={cn(
          "h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold",
          isUser ? "bg-indigo-500 text-white" : "bg-zinc-800 text-zinc-300"
        )}
      >
        {isUser ? "You" : "AI"}
      </div>

      {/* Content */}
      <div className={cn("flex-1 max-w-[85%]", isUser && "flex flex-col items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm",
            isUser
              ? "bg-indigo-500/20 text-zinc-200 rounded-tr-sm"
              : "bg-zinc-800 text-zinc-200 rounded-tl-sm"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    const isInline = !match;
                    return isInline ? (
                      <code
                        className="bg-zinc-900 px-1.5 py-0.5 rounded text-indigo-300 text-xs"
                        {...props}
                      >
                        {children}
                      </code>
                    ) : (
                      <SyntaxHighlighter
                        style={oneDark}
                        language={match[1]}
                        PreTag="div"
                        className="!bg-zinc-900 !rounded-lg !text-xs"
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    );
                  },
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
                  li: ({ children }) => <li className="text-zinc-300">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                  h1: ({ children }) => <h1 className="text-base font-bold text-white mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-sm font-semibold text-white mb-1.5">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-medium text-white mb-1">{children}</h3>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-indigo-500 pl-3 text-zinc-400 italic">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>

              {/* Typing cursor */}
              {message.isStreaming && (
                <span className="inline-block w-1.5 h-4 bg-indigo-400 animate-pulse ml-0.5 align-text-bottom" />
              )}
            </div>
          )}
        </div>

        {/* Tool calls */}
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.toolCalls.map((tc, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-900 border border-white/10 text-xs"
              >
                <Wrench className="h-3 w-3 text-orange-400" />
                <span className="text-zinc-400">{tc.toolName}</span>
                {tc.status === "success" ? (
                  <CheckCircle className="h-3 w-3 text-green-400" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-400" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Sources */}
        {!isUser && message.sources && message.sources.length > 0 && !message.isStreaming && (
          <div className="mt-3 space-y-1">
            <p className="text-xs text-zinc-500 flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              Sources
            </p>
            <div className="flex flex-wrap gap-2">
              {message.sources.slice(0, 4).map((source, idx) => (
                <Badge
                  key={source.chunkId}
                  variant="outline"
                  className="text-xs border-indigo-500/30 text-indigo-400 bg-indigo-500/5"
                  title={source.content.slice(0, 200)}
                >
                  [{idx + 1}] {source.documentName}
                  <span className="ml-1.5 text-zinc-500">
                    {(source.score * 100).toFixed(0)}%
                  </span>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
