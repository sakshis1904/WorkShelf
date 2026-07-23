import fs from "fs";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Load .env.local manually
const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
let apiKey = "";
for (const line of envContent.split("\n")) {
  if (line.startsWith("GEMINI_API_KEY=")) {
    apiKey = line.substring(line.indexOf("=") + 1).trim();
  }
}

if (!apiKey) {
  console.error("GEMINI_API_KEY not found in .env.local");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function testEmbedding(modelName) {
  try {
    console.log(`Testing embedding model: ${modelName} with outputDimensionality: 768...`);
    const model = genAI.getGenerativeModel({ model: modelName });
    // In SDK, embedContent can accept config options or parameter overrides
    const result = await model.embedContent({
      content: { parts: [{ text: "Hello, world!" }] },
      outputDimensionality: 768
    });
    console.log(`Success! Embedding length: ${result.embedding.values.length}`);
    return true;
  } catch (err) {
    console.error(`Failed for ${modelName}:`, err.message);
    return false;
  }
}

testEmbedding("gemini-embedding-2");
