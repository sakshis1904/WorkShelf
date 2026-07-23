# Architecture — WorkShelf

## High-Level Architecture

```
Browser (Next.js Client)
    │
    ├── /  (Landing Page — static)
    ├── /sign-in, /sign-up  (Clerk hosted pages)
    └── /dashboard/*  (Protected, dynamic)
            │
            ▼
Next.js App Router (Server)
    │
    ├── Route Handlers (/api/*)
    │       ├── /api/workspaces
    │       ├── /api/documents
    │       ├── /api/chat         ← SSE streaming
    │       ├── /api/tools
    │       ├── /api/debug
    │       ├── /api/tasks
    │       └── /api/uploadthing
    │
    ├── Services Layer
    │       ├── workspace.service.ts
    │       ├── document.service.ts
    │       ├── embedding.service.ts
    │       ├── rag.service.ts
    │       ├── tools.service.ts
    │       └── chat.service.ts
    │
    └── Repository Layer (Mongoose Models)
            ├── WorkspaceModel
            ├── DocumentModel
            ├── DocumentChunkModel
            ├── ChatModel
            ├── ChatMessageModel
            ├── ToolLogModel
            └── TaskModel
```

## Data Flow

### Document Upload
```
Browser → UploadThing CDN → Webhook → /api/uploadthing/core.ts
    → fetchFile() → extractText() → chunkText()
    → generateEmbeddings() (Gemini batch)
    → DocumentChunkModel.insertMany()
    → DocumentModel.status = "ready"
```

### Chat Query
```
Browser POST /api/chat
    → auth() [Clerk]
    → retrieveRelevantChunks() [MongoDB Atlas Vector Search, filtered by workspaceId]
    → buildRagPrompt() [inject chunks as context]
    → Gemini 2.5 Flash streaming
    → SSE stream to browser
    → tool calls handled inline
    → ChatMessageModel saved
```

## MongoDB Collections

| Collection      | Key Indexes                          | Purpose                    |
|----------------|--------------------------------------|----------------------------|
| workspaces      | userId, userId+name (unique)         | User workspaces            |
| documents       | workspaceId, workspaceId+contentHash | Uploaded files + dedup     |
| documentchunks  | workspaceId+documentId, vector_index | Embeddings for RAG         |
| chats           | workspaceId+updatedAt                | Chat sessions              |
| chatmessages    | chatId+createdAt                     | Individual messages        |
| toollogs        | workspaceId+createdAt                | Tool execution history     |
| tasks           | workspaceId+status                   | AI and manual tasks        |

## Vector Search Index (Atlas)

Collection: `documentchunks`
Index name: `vector_index`

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "workspaceId"
    }
  ]
}
```

## Security

- All routes protected by Clerk authentication
- `workspace_id` injected server-side — never trusted from client for data access
- Zod validates all API inputs
- Documents treated as data-only in prompts
- UploadThing validates file types and sizes server-side
