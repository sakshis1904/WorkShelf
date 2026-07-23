/**
 * Self-contained PDF text extraction script.
 * Runs as a child process with its own fresh V8 heap.
 * 
 * Receives: PDF bytes via stdin
 * Outputs: Extracted text to stdout, errors to stderr
 */

import { getDocumentProxy, extractText } from "unpdf";

// Read PDF bytes from stdin
const chunks = [];
for await (const chunk of process.stdin) {
  chunks.push(chunk);
}
const buffer = Buffer.concat(chunks);

try {
  console.error(`[extract-pdf-text] Processing ${buffer.length} bytes...`);
  
  // Parse PDF and extract text
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const result = await extractText(pdf, { mergePages: true });
  
  console.error(`[extract-pdf-text] Extracted ${result.text.length} characters`);
  
  // Write text to stdout
  process.stdout.write(result.text);
  process.exit(0);
} catch (error) {
  console.error(`[extract-pdf-text] ERROR: ${error.message}`);
  console.error(error.stack);
  process.stderr.write(`PDF extraction failed: ${error.message}`);
  process.exit(1);
}
