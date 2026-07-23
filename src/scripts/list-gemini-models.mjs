/**
 * List available Gemini models
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY not set");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

console.log("Fetching available Gemini models...\n");

try {
  const models = await genAI.listModels();
  
  console.log("=== Available Models ===\n");
  
  const embeddingModels = [];
  const chatModels = [];
  
  for (const model of models) {
    const name = model.name.replace('models/', '');
    const methods = model.supportedGenerationMethods || [];
    
    if (methods.includes('embedContent')) {
      embeddingModels.push(name);
    }
    if (methods.includes('generateContent')) {
      chatModels.push(name);
    }
  }
  
  console.log("EMBEDDING MODELS:");
  embeddingModels.forEach(m => console.log(`  - ${m}`));
  
  console.log("\nCHAT/GENERATION MODELS:");
  chatModels.forEach(m => console.log(`  - ${m}`));
  
} catch (error) {
  console.error("Error:", error.message);
  process.exit(1);
}
