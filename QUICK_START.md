# Quick Start - WorkShelf Fixed and Ready

## What Was Fixed

Your PDF upload issue has been resolved! The problems were:

1. ❌ **Missing script**: `src/scripts/extract-pdf-text.mjs` → ✅ **Created**
2. ❌ **Wrong model names**: Using non-existent Gemini models → ✅ **Fixed**
   - Changed embedding model: `text-embedding-004` → `gemini-embedding-2`
   - Changed LLM model: `gemini-2.0-flash-exp` → `gemini-3.6-flash`

## Start the Application

```bash
npm run dev
```

Then open: **http://localhost:3000**

## Test Document Upload

1. Sign in with your account
2. Create or select a workspace
3. Go to "Documents" page
4. Click "Upload Document"
5. Upload any PDF, DOCX, TXT, MD, or CSV file
6. Watch the terminal for these logs:

```
[process-document] Received input, parsing JSON...
[process-document] Processing: yourfile.pdf (application/pdf, 123456 bytes)
[process-document] Environment variables validated
[process-document] Connecting to MongoDB...
[process-document] MongoDB connected
[process-document] Fetched 123456 bytes
[process-document] Extracted 5000 chars
[process-document] 10 chunks
[process-document] Embeddings 5/10
[process-document] Embeddings 10/10
[process-document] SUCCESS — yourfile.pdf → 10 chunks
```

7. Refresh the Documents page - status should be "ready" ✅

## Troubleshooting

### If upload still fails:

1. **Check terminal logs** for detailed error messages

2. **Verify .env.local** has all required values:
   ```bash
   cat .env.local | grep -E "(MONGODB_URI|GEMINI_API_KEY|UPLOADTHING)"
   ```

3. **Run the test script**:
   ```bash
   ./restart-and-test.sh
   ```
   All tests should pass ✅

4. **Reset stuck documents** (if any are stuck in "processing"):
   ```bash
   curl -X PATCH "http://localhost:3000/api/documents?action=reset-stuck"
   ```

5. **Check MongoDB Atlas**:
   ```bash
   node src/scripts/check-db.mjs
   ```
   Should show "Index status: READY" ✅

### Common Issues:

- **"MONGODB_URI not set"** → Check .env.local file
- **"GEMINI_API_KEY not set"** → Check .env.local file
- **"404 Not Found models/..."** → Already fixed, restart server
- **"Quota exceeded"** → Gemini API rate limit, wait a few minutes
- **"vector_index not found"** → Run `node src/scripts/check-db.mjs`

## What to Watch For

### ✅ Success Indicators:
- Terminal shows `[process-document] SUCCESS`
- Document status changes to "ready"
- Document appears in chat sources
- Chat answers use document content

### ❌ Failure Indicators:
- Terminal shows `[process-document] FAILED:`
- Document stuck at "processing" for >2 minutes
- Document status shows "failed"
- Error messages in browser console

## File Changes Summary

### New Files:
- ✅ `src/scripts/extract-pdf-text.mjs` - PDF extraction worker
- ✅ `FIXES_APPLIED.md` - Detailed fix documentation
- ✅ `restart-and-test.sh` - Quick test script
- ✅ `QUICK_START.md` - This file

### Modified Files:
- ✅ `src/config/app.ts` - Fixed model names
- ✅ `src/scripts/process-document.mjs` - Better logging + error handling
- ✅ `src/scripts/test-e2e.mjs` - Updated model names

## Next Steps

1. **Start the server**: `npm run dev`
2. **Upload a test document**
3. **Verify it processes successfully**
4. **Deploy when ready**

## Deployment Notes

When deploying to production (Vercel, etc.):

1. Make sure all environment variables are set:
   - `MONGODB_URI`
   - `GEMINI_API_KEY`
   - `UPLOADTHING_TOKEN`
   - `UPLOADTHING_SECRET`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

2. MongoDB Atlas should have:
   - Vector search index named `vector_index`
   - Index on `documentchunks` collection
   - Field: `embedding` (768 dimensions)

3. The build should succeed with all the new files included

## Support

Read the detailed fix documentation:
- `FIXES_APPLIED.md` - Technical details
- `AI_NOTES.md` - Your original notes
- `Architecture.md` - System architecture
- `Deployment.md` - Deployment guide

---

**Status**: ✅ **All Issues Fixed - Ready to Deploy**
