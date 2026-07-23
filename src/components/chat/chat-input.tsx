"use client";

import { useState, KeyboardEvent, useRef } from "react";
import { Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop: () => void;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  onStop,
  isLoading,
  disabled,
  placeholder = "Ask a question about your documents...",
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSend() {
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInput() {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }

  return (
    <div className="relative flex items-end gap-2 p-4 border-t border-white/10 bg-zinc-950">
      <Textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          handleInput();
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isLoading}
        rows={1}
        className={cn(
          "flex-1 resize-none bg-zinc-900 border-white/10 text-zinc-200 placeholder:text-zinc-600",
          "focus-visible:ring-indigo-500/50 rounded-xl min-h-10 max-h-40 overflow-y-auto",
          "disabled:opacity-50 disabled:cursor-not-allowed pr-12"
        )}
      />
      <Button
        size="icon"
        onClick={isLoading ? onStop : handleSend}
        disabled={!isLoading && (!input.trim() || disabled)}
        className={cn(
          "h-10 w-10 rounded-xl flex-shrink-0 transition-all",
          isLoading
            ? "bg-red-500 hover:bg-red-600"
            : "bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40"
        )}
      >
        {isLoading ? (
          <Square className="h-4 w-4" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
