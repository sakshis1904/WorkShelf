"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black pt-16">
      {/* Gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Badge
            variant="outline"
            className="mb-6 border-indigo-500/50 bg-indigo-500/10 text-indigo-300 px-4 py-1"
          >
            <Sparkles className="mr-1.5 h-3 w-3" />
            Powered by Gemini 2.5 Flash + RAG
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-tight"
        >
          Your Documents,
          <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Intelligently Answered
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed"
        >
          Upload PDFs, DOCX, TXT, CSV and Markdown files. Ask questions in natural language.
          Get cited answers from your documents — across isolated workspaces.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/sign-up">
            <Button
              size="lg"
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 h-12 text-base"
            >
              Start for Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="#how-it-works">
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/5 px-8 h-12 text-base"
            >
              See How It Works
            </Button>
          </Link>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-16 flex flex-wrap gap-6 justify-center"
        >
          {[
            { icon: Shield, text: "Workspace Isolation" },
            { icon: Zap, text: "Streaming Responses" },
            { icon: Sparkles, text: "No Hallucinations" },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-2 text-sm text-zinc-500"
            >
              <Icon className="h-4 w-4 text-indigo-400" />
              <span>{text}</span>
            </div>
          ))}
        </motion.div>

        {/* Demo preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-16 relative mx-auto max-w-3xl"
        >
          <div className="rounded-2xl border border-white/10 bg-zinc-900/80 backdrop-blur overflow-hidden shadow-2xl shadow-indigo-500/10">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
              <div className="h-3 w-3 rounded-full bg-red-500/70" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
              <div className="h-3 w-3 rounded-full bg-green-500/70" />
              <span className="ml-2 text-xs text-zinc-500">WorkShelf Chat</span>
            </div>
            <div className="p-6 space-y-4 text-left">
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-zinc-700 flex-shrink-0 flex items-center justify-center text-xs text-zinc-300">
                  You
                </div>
                <div className="bg-indigo-500/20 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-zinc-200">
                  What are the key findings from the Q3 report?
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-indigo-600 flex-shrink-0 flex items-center justify-center text-xs text-white">
                  AI
                </div>
                <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-zinc-300 space-y-1">
                  <p>Based on the Q3 report [Source 1], the key findings are:</p>
                  <p className="text-zinc-400">• Revenue grew 23% YoY to $4.2M</p>
                  <p className="text-zinc-400">• Customer retention improved to 94%</p>
                  <p className="text-zinc-400">• 3 new enterprise clients onboarded</p>
                  <div className="mt-2 pt-2 border-t border-white/10 flex gap-2">
                    <Badge variant="outline" className="text-xs border-indigo-500/30 text-indigo-400">
                      📄 Q3-Report.pdf
                    </Badge>
                    <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-500">
                      Score: 0.94
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
