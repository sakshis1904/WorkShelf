# Fixes Applied to WorkShelf - PDF Upload Issue

## Date: 2026-07-23

## Problem
PDF uploads were getting stuck at "processing" status and the server was closing automatically. The document processing pipeline was failing silently.

## Root Causes Identified

### 1. Missing PDF Extraction Script
**Issue**: The file `src/scripts/extract-pdf-text.mjs` was missing, causing the `text-extractor.ts` to fail when trying to spawn the child process for PDF extraction.

**Fix**: Created `src/scripts/extract-pdf-text.mjs` with proper PDF extraction using the `unpdf` library.

### 2. Incorrect Model Names
**Issue**: The code was using incorrect Gemini API model names:
- Was using: `text-embedding-004` (doesn't exist)
- Was using: `gemini-2.0-flash-exp` (not available/quota exceeded)

**Fix**: Updated to correct model names:
- Embedding model: `gemini-embedding-2` ✅
- LLM model: `gemini-3.6-flash` ✅

## Files Modified

### Created Files:
1. `/src/scripts/extract-pdf-text.mjs` - NEW
   - Handles PDF text extraction in isolated process
   - Uses `unpdf` library
   - Reads PDF bytes from stdin, outputs text to stdout

### Modified Files:
1. `/src/config/app.ts`
   - Changed `embeddingModel` from `"text-embedding-004"` to `"gemini-embedding-2"`
   - Changed `llmModel` from `"gemini-2.0-flash-exp"` to `"gemini-3.6-flash"`

2. `/src/scripts/process-document.mjs`
   - Updated embedding model to `"gemini-embedding-2"`
   - Added comprehensive logging at each step
   - Added timeout handler (5 minutes)
   - Added better error handling for embedding batches
   - Added error logging with stack traces

3. `/src/scripts/test-e2e.mjs`
   - Updated embedding model to `"gemini-embedding-2"`
   - Updated chat model to `"gemini-3.6-flash"`

### Test Scripts Created:
1. `/src/scripts/test-document-processing.mjs` - Tests all components
2. `/src/scripts/list-gemini-models.mjs` - Lists available models
3. `/test-embedding-models.mjs` - Tests embedding models
4. `/test-llm-models.mjs` - Tests LLM models
5. `/test-pdf-upload.sh` - Helper script for manual testing

## Verification

All tests now pass:
✅ MongoDB Connection
✅ Gemini Embeddings (gemini-embedding-2, 768 dimensions)
✅ PDF Extraction (unpdf library)
✅ Text Chunking
✅ LLM Generation (gemini-3.6-flash)

## How to Test

### 1. Run Full Test Suite
```bash
export $(cat .env.local | grep -v '^#' | xargs)
node src/scripts/test-document-processing.mjs
```

### 2. Test Document Upload
```bash
npm run dev
```

Then:
1. Open http://localhost:3000
2. Sign in
3. Create/select a workspace
4. Upload a PDF document
5. Watch the terminal for logs like:
   ```
   [process-document] Received input, parsing JSON...
   [process-document] Processing: filename.pdf
   [process-document] MongoDB connected
   [process-document] Extracted N chars
   [process-document] N chunks generated
   [process-document] Embeddings N/N
   [process-document] SUCCESS
   ```

### 3. Check Document Status
Go to the Documents page in the dashboard and verify the document status changes from "processing" to "ready".

## Additional Improvements Made

1. **Better Logging**: Added detailed console logs at each step of processing
2. **Timeout Protection**: Added 5-minute timeout to prevent hanging processes
3. **Error Handling**: Better error messages with stack traces
4. **Environment Validation**: Early check for required environment variables
5. **Graceful Cleanup**: Proper timeout clearing and database connection closing

## Known Limitations

1. **Rate Limits**: Gemini API free tier has rate limits:
   - gemini-3.6-flash: 15 RPM, 1,000 RPD
   - gemini-embedding-2: Check current limits in Google AI Studio

2. **Large Files**: Very large PDFs (>8MB) are rejected by UploadThing config
3. **Complex PDFs**: Some PDFs with complex formatting may not extract perfectly

## Next Steps (If Issues Persist)

1. Check the terminal/console for detailed error messages
2. Verify `.env.local` has valid credentials:
   - MONGODB_URI
   - GEMINI_API_KEY
   - UPLOADTHING_TOKEN
   - UPLOADTHING_SECRET

3. Check MongoDB Atlas vector index is created:
   ```bash
   node src/scripts/check-db.mjs
   ```

4. Reset stuck documents:
   ```bash
   curl -X PATCH "http://localhost:3000/api/documents?action=reset-stuck"
   ```

## Support

If you encounter issues:
1. Check browser console for frontend errors
2. Check terminal for backend logs
3. Look for `[process-document]` logs for document processing
4. Check UploadThing dashboard for upload status
5. Check MongoDB Atlas for vector index status

---

## Summary

The main issues were:
1. **Missing script file** that the code was trying to spawn
2. **Wrong Gemini model names** causing API 404 errors

Both are now fixed and verified working. The document processing pipeline should now work end-to-end.
