"use client";

import { motion } from "framer-motion";

const techStack = [
  { name: "Next.js 15", category: "Frontend", color: "bg-white/10 text-white" },
  { name: "React 19", category: "Frontend", color: "bg-blue-500/10 text-blue-300" },
  { name: "TypeScript", category: "Language", color: "bg-blue-600/10 text-blue-400" },
  { name: "TailwindCSS", category: "Styling", color: "bg-cyan-500/10 text-cyan-300" },
  { name: "shadcn/ui", category: "UI", color: "bg-zinc-500/10 text-zinc-300" },
  { name: "Framer Motion", category: "Animation", color: "bg-pink-500/10 text-pink-300" },
  { name: "Clerk", category: "Auth", color: "bg-purple-500/10 text-purple-300" },
  { name: "MongoDB", category: "Database", color: "bg-green-500/10 text-green-300" },
  { name: "Atlas Vector Search", category: "Vector DB", color: "bg-green-600/10 text-green-400" },
  { name: "Gemini 2.5 Flash", category: "LLM", color: "bg-indigo-500/10 text-indigo-300" },
  { name: "text-embedding-004", category: "Embeddings", color: "bg-indigo-400/10 text-indigo-400" },
  { name: "UploadThing", category: "Storage", color: "bg-orange-500/10 text-orange-300" },
  { name: "TanStack Query", category: "Data Fetching", color: "bg-red-500/10 text-red-300" },
  { name: "Zod", category: "Validation", color: "bg-yellow-500/10 text-yellow-300" },
  { name: "Pino", category: "Logging", color: "bg-amber-500/10 text-amber-300" },
  { name: "Vercel", category: "Deployment", color: "bg-white/10 text-zinc-300" },
];

export function Technology() {
  return (
    <section id="technology" className="py-24 bg-black">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Built with Modern Stack</h2>
          <p className="mt-4 text-zinc-400 max-w-xl mx-auto">
            Production-ready technologies chosen for reliability, performance, and developer experience.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap gap-3 justify-center"
        >
          {techStack.map((tech, idx) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.03 }}
              className={`px-4 py-2 rounded-full border border-white/10 ${tech.color} text-sm font-medium`}
            >
              {tech.name}
              <span className="ml-2 text-xs opacity-60">({tech.category})</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
