export const dynamic = "force-dynamic";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center p-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500 mb-6">
        <BookOpen className="h-8 w-8 text-white" />
      </div>
      <h1 className="text-6xl font-bold text-white mb-4">404</h1>
      <h2 className="text-xl text-zinc-300 mb-2">Page Not Found</h2>
      <p className="text-zinc-500 mb-8 max-w-sm">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link href="/">
        <Button className="bg-indigo-500 hover:bg-indigo-600">Go Home</Button>
      </Link>
    </div>
  );
}
