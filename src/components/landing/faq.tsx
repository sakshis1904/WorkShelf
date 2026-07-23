"use client";

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "How does workspace isolation work?",
    a: "Each workspace has a unique ID. When documents are uploaded, chunks are stored with that workspace_id. All vector searches include a strict filter: { workspaceId: <current workspace> }. This means the AI can never retrieve chunks from another workspace, even if embeddings are similar.",
  },
  {
    q: "What happens if my question isn't in the documents?",
    a: "If no relevant chunks are found, or the context doesn't contain the answer, the AI responds with 'I don't know based on the uploaded documents.' It never makes up information.",
  },
  {
    q: "Is prompt injection possible?",
    a: "WorkShelf treats all document content as data only. The system prompt explicitly instructs the model to never follow instructions from documents. Even if a document says 'Ignore previous instructions', the model will not act on it.",
  },
  {
    q: "What file formats are supported?",
    a: "PDF, DOCX (Word), TXT (plain text), MD (Markdown), and CSV files up to 10MB each. Text is extracted using pdf-parse for PDFs and mammoth for DOCX files.",
  },
  {
    q: "How does tool calling work?",
    a: "The AI is given tool definitions (saveTask, sendSummary) as function declarations. When it detects you want to save a task or send a summary, it calls the appropriate tool. Every tool call is validated with Zod and logged with full input/output/latency details.",
  },
  {
    q: "Can I have multiple workspaces?",
    a: "Yes. You can create as many workspaces as needed. Each one has its own documents, chats, tasks, and tool logs. Switch between them using the workspace switcher in the sidebar.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-24 bg-zinc-950">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Frequently Asked Questions</h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, idx) => (
              <AccordionItem
                key={idx}
                value={`item-${idx}`}
                className="border border-white/10 rounded-xl bg-zinc-900/60 px-4"
              >
                <AccordionTrigger className="text-white hover:text-indigo-300 text-left">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400 text-sm leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
