# WorkShelf — Multi-Workspace AI Document Assistant

> Upload documents. Ask questions. Get cited answers. Fully isolated per workspace.

---

## Overview

WorkShelf is a production-ready SaaS application that lets users upload documents (PDF, DOCX, TXT, MD, CSV), ask questions in natural language, and get precise answers powered by **RAG (Retrieval-Augmented Generation)** with **Gemini 2.5 Flash**. Every answer includes source citations. Documents are fully isolated per workspace.

---

## Features

- **Multi-workspace support** — create, switch, rename, delete workspaces
- **Document upload** — PDF, DOCX, TXT, Markdown, CSV with duplicate detection
- **RAG pipeline** — semantic vector search + Gemini LLM
- **Workspace isolation** — vector search filtered by `workspaceId` at DB level
- **Streaming chat** — real-time SSE token streaming with markdown rendering
- **Source citations** — every answer shows which document/chunk was used
- **Tool calling** — AI can `saveTask()` and `sendSummary()` to Slack/Discord
- **Retrieval Debug** — inspect retrieved chunks, scores, and metadata
- **Tool logs** — full history of all AI tool executions
- **Prompt injection protection** — documents treated as data only

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript |
| Styling | TailwindCSS v4, shadcn/ui, Framer Motion |
| Auth | Clerk |
| Database | MongoDB + Mongoose |
| Vector DB | MongoDB Atlas Vector Search |
| Embeddings | Gemini `text-embedding-004` (768 dims) |
| LLM | Gemini 2.5 Flash |
| Storage | UploadThing |
| Validation | Zod (everywhere) |
| Logging | Pino |
| Deployment | Vercel |

---

## Folder Structure

```
src/
├── app/
│   ├── (auth)/              # Clerk sign-in/sign-up pages
│   ├── (dashboard)/         # Protected dashboard routes
│   │   └── dashboard/
│   │       ├── page.tsx     # Dashboard overview
│   │       ├── documents/   # Upload & manage documents
│   │       ├── chat/        # AI chat interface
│   │       ├── tool-logs/   # Tool execution history
│   │       ├── debug/       # Retrieval debugger
│   │       ├── settings/    # Workspace settings
│   │       └── profile/     # User profile
│   ├── api/                 # Route handlers
│   │   ├── workspaces/
│   │   ├── documents/
│   │   ├── chat/            # SSE streaming endpoint
│   │   ├── tools/
│   │   ├── tasks/
│   │   ├── debug/
│   │   └── uploadthing/
│   ├── page.tsx             # Landing page
│   └── layout.tsx           # Root layout (Clerk + Theme)
├── components/
│   ├── landing/             # Hero, Features, FAQ, etc.
│   ├── dashboard/           # Sidebar, Header, StatsCard
│   ├── chat/                # MessageBubble, ChatInput, ChatSidebar
│   ├── providers/           # QueryProvider, ThemeProvider
│   └── ui/                  # shadcn components
├── services/                # Business logic
│   ├── workspace.service.ts
│   ├── document.service.ts
│   ├── embedding.service.ts
│   ├── rag.service.ts
│   ├── tools.service.ts
│   └── chat.service.ts
├── repositories/            # Mongoose models
├── hooks/                   # use-workspace, use-chat
├── lib/                     # mongodb, auth, logger, utils
├── types/                   # TypeScript interfaces
├── utils/                   # text-extractor, text-chunker
├── config/                  # app.ts config constants
└── constants/               # Routes, messages, tool names
```

---

## How RAG Works

1. **Embed query** — user question → `text-embedding-004` → 768-dim vector
2. **Vector search** — MongoDB Atlas finds top-K similar chunks, filtered by `workspaceId`
3. **Build prompt** — chunks injected as context with strict "data only" rules
4. **Stream answer** — Gemini 2.5 Flash streams tokens back with citations
5. **No context** → returns: _"I don't know based on the uploaded documents."_

---

## How Tool Calling Works

Tools are defined as Gemini function declarations:

```ts
// saveTask — saves to MongoDB
// sendSummary — posts to Slack or Discord webhook
```

The model decides when to call tools based on user intent. Every call is:
- Validated with Zod before execution
- Logged in `ToolLog` collection with input, output, status, latency
- Displayed in the Tool Logs dashboard

---

## How Workspace Isolation Works

Every vector search runs with a mandatory filter:

```js
{
  $vectorSearch: {
    filter: { workspaceId: new ObjectId(workspaceId) }
  }
}
```

This means chunks from other workspaces are **never retrieved**, regardless of semantic similarity. The filter is applied at the database level, not in application code.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk frontend key |
| `CLERK_SECRET_KEY` | ✅ | Clerk backend key |
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `GEMINI_API_KEY` | ✅ | Google AI Studio API key |
| `UPLOADTHING_TOKEN` | ✅ | UploadThing token |
| `UPLOADTHING_SECRET` | ✅ | UploadThing secret |
| `SLACK_WEBHOOK` | ⚪ | Slack incoming webhook URL |
| `DISCORD_WEBHOOK` | ⚪ | Discord webhook URL |
| `NEXT_PUBLIC_APP_URL` | ⚪ | Your app URL |

---

## Local Setup

```bash
npm install
cp .env.example .env.local
# fill in .env.local values
npm run dev
```

---

## Deployment

See [Deployment.md](./Deployment.md) for the complete step-by-step guide.

---

## Sample Test Documents

- A company Q3 financial report (PDF)
- A product specification document (DOCX)
- Meeting notes (TXT or MD)
- Employee data (CSV)

## Sample Test Questions

- "What are the key findings from the report?"
- "Summarize the main points in 3 bullet points"
- "Save a task to review the action items by Friday"
- "Send a summary of the findings to Slack"
- "What does the document say about revenue growth?"

---

## Common Errors

| Error | Fix |
|---|---|
| `MONGODB_URI not defined` | Add MongoDB URI to `.env.local` |
| `vector_index not found` | Create the Atlas vector search index (see Deployment.md) |
| Clerk auth error | Use real Clerk keys, not dummy values |
| UploadThing 403 | Verify UploadThing token and secret |
| `No chunks found` | Document may still be processing (status: processing) |
| Duplicate document | Same file already uploaded in this workspace |

---

## Future Improvements

- Hybrid search (vector + full-text BM25)
- Cross-workspace document sharing
- Re-ranking with Cohere or a cross-encoder
- Token usage dashboard
- Rate limiting per user/workspace
- Document version history
- Export chat as PDF/Markdown
- Multi-language support
