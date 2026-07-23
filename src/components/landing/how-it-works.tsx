"use client";

import { motion } from "framer-motion";
import { Upload, Brain, Layers, MessageSquare, CheckCircle } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: Upload,
    title: "Upload Documents",
    description:
      "Upload PDF, DOCX, TXT, MD, or CSV files. WorkShelf extracts text, chunks it into 1000-character segments, and generates embeddings using Gemini.",
    color: "from-blue-500 to-indigo-500",
  },
  {
    step: "02",
    icon: Layers,
    title: "Vectors Stored",
    description:
      "Embeddings are stored in MongoDB Atlas Vector Search with your workspace_id attached. Documents are fully isolated per workspace.",
    color: "from-indigo-500 to-purple-500",
  },
  {
    step: "03",
    icon: Brain,
    title: "Query Processing",
    description:
      "Your question is embedded using the same model. A vector search retrieves the top-K most relevant chunks, filtered strictly by workspace_id.",
    color: "from-purple-500 to-pink-500",
  },
  {
    step: "04",
    icon: MessageSquare,
    title: "Cited Answer",
    description:
      "The retrieved chunks are passed to Gemini 2.5 Flash with a strict prompt. The model answers only from context and cites its sources.",
    color: "from-pink-500 to-red-500",
  },
  {
    step: "05",
    icon: CheckCircle,
    title: "Tools Executed",
    description:
      "If you ask to save a task or send a summary, the model calls the appropriate tool. Every execution is logged with input, output, and latency.",
    color: "from-orange-500 to-yellow-500",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-zinc-950">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white">How It Works</h2>
          <p className="mt-4 text-zinc-400 max-w-xl mx-auto">
            A transparent look at the RAG pipeline from upload to answer.
          </p>
        </motion.div>

        <div className="space-y-6">
          {steps.map((step, idx) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="flex gap-6 p-6 rounded-xl border border-white/10 bg-zinc-900/60"
            >
              <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center`}>
                <step.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-zinc-500">Step {step.step}</span>
                </div>
                <h3 className="font-semibold text-white mb-1">{step.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
