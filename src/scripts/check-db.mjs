import fs from "fs";
import path from "path";
import { MongoClient } from "mongodb";

// Load .env.local manually
const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
let mongoUri = "";
for (const line of envContent.split("\n")) {
  if (line.startsWith("MONGODB_URI=")) {
    mongoUri = line.substring(line.indexOf("=") + 1).trim();
  }
}

if (!mongoUri) {
  console.error("MONGODB_URI not found in .env.local");
  process.exit(1);
}

async function run() {
  const client = new MongoClient(mongoUri);
  try {
    console.log("Connecting to MongoDB...");
    await client.connect();
    const db = client.db();
    const col = db.collection("documentchunks");
    
    console.log("Creating Vector Search Index on documentchunks...");
    const indexDefinition = {
      name: "vector_index",
      type: "vectorSearch",
      definition: {
        fields: [
          {
            type: "vector",
            path: "embedding",
            numDimensions: 768,
            similarity: "cosine"
          },
          {
            type: "filter",
            path: "workspaceId"
          }
        ]
      }
    };
    
    const result = await col.createSearchIndex(indexDefinition);
    console.log("Index creation initiated. Result name:", result);
    
    console.log("Waiting for index to be active (this might take a minute)...");
    let active = false;
    for (let i = 0; i < 20; i++) {
      const indexes = await col.listSearchIndexes().toArray();
      const idx = indexes.find(index => index.name === "vector_index");
      if (idx) {
        console.log(`Index status: ${idx.status} - ${idx.queryable ? "Queryable" : "Not queryable yet"}`);
        if (idx.status === "STEADY" || idx.queryable) {
          active = true;
          break;
        }
      } else {
        console.log("Index not found in list yet...");
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    if (active) {
      console.log("Vector Search Index is fully active and ready!");
    } else {
      console.log("Index creation is in progress. It should become active shortly.");
    }
  } catch (err) {
    console.error("Failed to create search index:", err);
  } finally {
    await client.close();
  }
}

run();
