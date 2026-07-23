import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@clerk/nextjs/server";
import { spawn } from "child_process";
import { join } from "path";
import { z } from "zod";

const f = createUploadthing();

export const ourFileRouter = {
  documentUploader: f({
    pdf: { maxFileSize: "8MB" },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "8MB",
    },
    text: { maxFileSize: "4MB" },
  })
    .input(z.object({ workspaceId: z.string().min(1) }))
    .middleware(async ({ input }) => {
      const { userId } = await auth();
      if (!userId) throw new Error("Unauthorized");
      return { userId, workspaceId: input.workspaceId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Spawn a completely separate Node.js process for the entire processing pipeline.
      // This process gets its own fresh V8 heap (~200MB), isolated from the
      // Next.js dev server's 4GB heap, preventing OOM crashes.
      const scriptPath = join(process.cwd(), "src/scripts/process-document.mjs");
      const input = JSON.stringify({
        fileUrl: file.ufsUrl,
        fileKey: file.key,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        workspaceId: metadata.workspaceId,
        userId: metadata.userId,
      });

      const child = spawn(process.execPath, [scriptPath], {
        stdio: ["pipe", "pipe", "pipe"],
        env: process.env, // inherit all env vars including MONGODB_URI, GEMINI_API_KEY
        detached: true,   // run independently of the parent process
      });

      child.stdout.on("data", (d: Buffer) =>
        console.log("[process-document] stdout:", d.toString().trim())
      );
      child.stderr.on("data", (d: Buffer) =>
        console.error("[process-document] stderr:", d.toString().trim())
      );
      child.on("close", (code: number) =>
        console.log(`[process-document] exited with code ${code}`)
      );
      child.on("error", (err: Error) =>
        console.error("[process-document] spawn error:", err.message)
      );

      child.stdin.write(input);
      child.stdin.end();
      child.unref(); // don't block the parent from exiting

      return { fileKey: file.key, fileName: file.name };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
