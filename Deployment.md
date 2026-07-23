# Deployment Guide — WorkShelf

## Prerequisites

- Node.js 18+
- MongoDB Atlas account (free tier works)
- Clerk account
- Google AI Studio account (Gemini API Key)
- UploadThing account
- Vercel account

---

## Step 1 — MongoDB Atlas Setup

1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create a free cluster (M0)
3. Create a database user with read/write access
4. Add your IP to the allow list (or use `0.0.0.0/0` for all)
5. Get the connection string:
   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/workshelf?retryWrites=true&w=majority
   ```
6. **Create the Vector Search Index** on the `documentchunks` collection:
   - Go to Atlas → Search → Create Index → JSON Editor
   - Collection: `documentchunks`
   - Index name: `vector_index`
   - JSON:
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

---

## Step 2 — Gemini API Key

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Click "Get API Key" → Create API Key
3. Copy the key (starts with `AIza...`)

---

## Step 3 — Clerk Setup

1. Go to [clerk.com](https://clerk.com) → Create application
2. Choose sign-in options (Email, Google, GitHub, etc.)
3. From the dashboard, copy:
   - **Publishable Key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Secret Key** → `CLERK_SECRET_KEY`

---

## Step 4 — UploadThing Setup

1. Go to [uploadthing.com](https://uploadthing.com) → Create app
2. From the dashboard, copy:
   - **Token** → `UPLOADTHING_TOKEN`
   - **Secret** → `UPLOADTHING_SECRET`

---

## Step 5 — Webhooks (Optional)

- **Slack**: Create an Incoming Webhook at [api.slack.com/apps](https://api.slack.com/apps)
- **Discord**: Server Settings → Integrations → Webhooks → New Webhook

---

## Step 6 — Local Setup

```bash
# Clone or navigate to project
cd /path/to/WorkShelf

# Install dependencies
npm install

# Copy env template
cp .env.example .env.local

# Fill in your values in .env.local
nano .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Step 7 — Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Or connect GitHub repo at vercel.com for auto-deploy
```

### Environment Variables on Vercel

Go to your Vercel project → Settings → Environment Variables and add all variables from `.env.example`.

### Required Vercel Settings

- **Framework**: Next.js (auto-detected)
- **Node.js version**: 18.x or 20.x
- **Build command**: `npm run build`
- **Output directory**: `.next`

---

## Testing Workspace Isolation

1. Create Workspace A, upload `document-a.pdf`
2. Create Workspace B, upload `document-b.pdf`
3. In Workspace A, ask a question that only `document-b.pdf` can answer
4. The AI should respond: "I don't know based on the uploaded documents."
5. Switch to Workspace B, ask the same question → correct answer with citations

---

## Monitoring

- Logs: Pino logger outputs to stdout (Vercel captures automatically)
- Tool logs: visible at `/dashboard/tool-logs`
- Retrieval debug: `/dashboard/debug`
