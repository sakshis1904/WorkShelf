"use client";

import { motion } from "framer-motion";
import {
  Search,
  Shield,
  FileText,
  MessageSquare,
  Wrench,
  BarChart3,
  Lock,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Multi-Format Upload",
    description: "Upload PDF, DOCX, TXT, Markdown, and CSV. Text is extracted, chunked, and vectorized automatically.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Search,
    title: "RAG-Powered Search",
    description: "Semantic vector search retrieves the most relevant chunks from your documents before answering.",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
  },
  {
    icon: Shield,
    title: "Workspace Isolation",
    description: "Each workspace is fully isolated. Queries only search documents within the active workspace.",
    color: "text-green-400",
    bg: "bg-green-500/10",
  },
  {
    icon: MessageSquare,
    title: "Cited Answers",
    description: "Every answer includes source citations with document name, chunk index, and similarity score.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: Wrench,
    title: "AI Tool Calling",
    description: "The AI can save tasks and send summaries to Slack/Discord automatically based on your request.",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
  },
  {
    icon: Zap,
    title: "Streaming Responses",
    description: "Real-time token streaming with markdown rendering, code highlighting, and typing animation.",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
  },
  {
    icon: BarChart3,
    title: "Retrieval Debug",
    description: "Built-in debug page shows retrieved chunks, similarity scores, and chunk metadata.",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
  },
  {
    icon: Lock,
    title: "Prompt Injection Safe",
    description: "Documents are treated only as data. Instructions embedded in documents are never executed.",
    color: "text-red-400",
    bg: "bg-red-500/10",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-black">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Everything You Need for Document AI
          </h2>
          <p className="mt-4 text-zinc-400 max-w-xl mx-auto">
            Production-ready features built with security, accuracy, and developer experience in mind.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="p-6 rounded-xl border border-white/10 bg-zinc-900/60 hover:bg-zinc-900 hover:border-white/20 transition-all"
            >
              <div className={`w-10 h-10 rounded-lg ${feature.bg} flex items-center justify-center mb-4`}>
                <feature.icon className={`h-5 w-5 ${feature.color}`} />
              </div>
              <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
