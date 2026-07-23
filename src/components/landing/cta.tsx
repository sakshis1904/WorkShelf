"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="py-24 bg-black">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative p-12 rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-500/10 to-transparent overflow-hidden"
        >
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Start Working Smarter
          </h2>
          <p className="text-zinc-400 mb-8 max-w-lg mx-auto">
            Create your first workspace, upload your documents, and get AI-powered answers with source citations in minutes.
          </p>
          <Link href="/sign-up">
            <Button
              size="lg"
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-10 h-12 text-base"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
