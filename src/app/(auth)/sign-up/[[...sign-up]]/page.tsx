import { SignUp } from "@clerk/nextjs";
import { BookOpen } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500">
          <BookOpen className="h-5 w-5 text-white" />
        </div>
        <span className="text-2xl font-bold text-white">WorkShelf</span>
      </div>
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-zinc-900 border border-white/10 shadow-2xl",
            headerTitle: "text-white",
            headerSubtitle: "text-zinc-400",
            socialButtonsBlockButton: "bg-zinc-800 border border-white/10 text-white hover:bg-zinc-700",
            formFieldLabel: "text-zinc-300",
            formFieldInput: "bg-zinc-800 border border-white/10 text-white placeholder:text-zinc-500",
            footerActionText: "text-zinc-400",
            footerActionLink: "text-indigo-400 hover:text-indigo-300",
            formButtonPrimary: "bg-indigo-500 hover:bg-indigo-600",
          },
        }}
      />
    </div>
  );
}
