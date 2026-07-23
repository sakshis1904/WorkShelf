import Link from "next/link";
import { BookOpen } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500">
              <BookOpen className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-white">WorkShelf</span>
          </div>
          <p className="text-sm text-zinc-500">
            Multi-Workspace AI Document Assistant • Built with Gemini + RAG
          </p>
          <div className="flex gap-4 text-sm text-zinc-500">
            <Link href="/sign-in" className="hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/sign-up" className="hover:text-white transition-colors">
              Sign Up
            </Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
