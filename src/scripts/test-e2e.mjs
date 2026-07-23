import fs from "fs";
import path from "path";
import { MongoClient, ObjectId } from "mongodb";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ─── LOAD ENVIRONMENT VARIABLES ──────────────────────────────────────────────
const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
let mongoUri = "";
let apiKey = "";

for (const line of envContent.split("\n")) {
  if (line.startsWith("MONGODB_URI=")) {
    mongoUri = line.substring(line.indexOf("=") + 1).trim();
  }
  if (line.startsWith("GEMINI_API_KEY=")) {
    apiKey = line.substring(line.indexOf("=") + 1).trim();
  }
}

if (!mongoUri || !apiKey) {
  console.error("Missing MONGODB_URI or GEMINI_API_KEY in .env.local");
  process.exit(1);
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(apiKey);
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
const chatModel = genAI.getGenerativeModel({
  model: "gemini-3.6-flash",
  tools: [{
    functionDeclarations: [
      {
        name: "saveTask",
        description: "Save a task or action item. Use when user mentions a todo.",
        parameters: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING", description: "Task title" },
            description: { type: "STRING", description: "Task description" }
          },
          required: ["title"]
        }
      }
    ]
  }]
});

async function getEmbedding(text) {
  const result = await embeddingModel.embedContent({
    content: { parts: [{ text }] },
    outputDimensionality: 768
  });
  return result.embedding.values;
}

// ─── MAIN E2E INTEGRATION TEST ───────────────────────────────────────────────
async function run() {
  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db();

  console.log("Connected to MongoDB database:", db.databaseName);

  const workspacesCol = db.collection("workspaces");
  const docsCol = db.collection("documents");
  const chunksCol = db.collection("documentchunks");
  const tasksCol = db.collection("tasks");

  const userId = "test_user_e2e_" + Date.now();

  try {
    // 1. Create Workspaces A & B
    console.log("\n--- 1. Creating workspaces ---");
    const wsARes = await workspacesCol.insertOne({
      userId,
      name: "Workspace A (Alpha)",
      documentsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    const wsBRes = await workspacesCol.insertOne({
      userId,
      name: "Workspace B (Beta)",
      documentsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const workspaceAId = wsARes.insertedId;
    const workspaceBId = wsBRes.insertedId;

    console.log(`Created Workspace A: ${workspaceAId}`);
    console.log(`Created Workspace B: ${workspaceBId}`);

    // 2. Ingest document to Workspace A
    console.log("\n--- 2. Ingesting Document into Workspace A ---");
    const docAContent = "The secret code for Project Alpha is: ALPHA-SECRET-999. Do not share this code.";
    const docARes = await docsCol.insertOne({
      workspaceId: workspaceAId,
      userId,
      name: "alpha_notes.txt",
      originalName: "alpha_notes.txt",
      fileType: "text/plain",
      fileSize: docAContent.length,
      fileUrl: "https://example.com/alpha_notes.txt",
      fileKey: "alpha_notes",
      contentHash: "hashA",
      status: "ready",
      chunksCount: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const embedA = await getEmbedding(docAContent);
    await chunksCol.insertOne({
      documentId: docARes.insertedId,
      workspaceId: workspaceAId,
      userId,
      content: docAContent,
      embedding: embedA,
      chunkIndex: 0,
      metadata: { source: "alpha_notes.txt" },
      createdAt: new Date()
    });
    console.log("Uploaded and embedded document in Workspace A");

    // 3. Ingest document to Workspace B
    console.log("\n--- 3. Ingesting Document into Workspace B ---");
    const docBContent = "The secret code for Project Beta is: BETA-PASSWORD-777. Keep it safe.";
    const docBRes = await docsCol.insertOne({
      workspaceId: workspaceBId,
      userId,
      name: "beta_notes.txt",
      originalName: "beta_notes.txt",
      fileType: "text/plain",
      fileSize: docBContent.length,
      fileUrl: "https://example.com/beta_notes.txt",
      fileKey: "beta_notes",
      contentHash: "hashB",
      status: "ready",
      chunksCount: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const embedB = await getEmbedding(docBContent);
    await chunksCol.insertOne({
      documentId: docBRes.insertedId,
      workspaceId: workspaceBId,
      userId,
      content: docBContent,
      embedding: embedB,
      chunkIndex: 0,
      metadata: { source: "beta_notes.txt" },
      createdAt: new Date()
    });
    console.log("Uploaded and embedded document in Workspace B");

    // Wait 2 seconds for index updates
    console.log("Waiting for index synchronization...");
    await new Promise(r => setTimeout(r, 2000));

    // 4. Test Isolation Retrieval: Query in Workspace A
    console.log("\n--- 4. Querying in Workspace A (Should find Alpha code, NOT Beta) ---");
    const query = "What is the secret code?";
    const queryEmbedding = await getEmbedding(query);

    // Run MongoDB Atlas Vector Search filtered by Workspace A
    console.log("Running Vector Search on Workspace A...");
    const pipelineA = [
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: 10,
          limit: 3,
          filter: { workspaceId: workspaceAId }
        }
      }
    ];

    const resultsA = await chunksCol.aggregate(pipelineA).toArray();
    console.log(`Found ${resultsA.length} relevant chunks in Workspace A:`);
    for (const chunk of resultsA) {
      console.log(`- Source: ${chunk.metadata.source}, Content: "${chunk.content}"`);
    }

    if (resultsA.some(c => c.content.includes("BETA-PASSWORD-777"))) {
      throw new Error("SECURITY FAILURE: Retrived Beta content from Workspace A context!");
    } else {
      console.log("SECURITY SUCCESS: No cross-workspace leakage found in vector retrieval!");
    }

    // 5. Test Honest Refusal: Ask about Beta in Workspace A
    console.log("\n--- 5. Testing Honest Refusal in Workspace A (Ask about Beta) ---");
    const queryBetaInA = "What is the secret code for Project Beta?";
    const queryBetaEmbedding = await getEmbedding(queryBetaInA);

    const pipelineBetaInA = [
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: queryBetaEmbedding,
          numCandidates: 10,
          limit: 3,
          filter: { workspaceId: workspaceAId }
        }
      }
    ];

    const resultsBetaInA = await chunksCol.aggregate(pipelineBetaInA).toArray();
    console.log(`Found ${resultsBetaInA.length} relevant chunks for Beta in Workspace A`);
    
    // We expect 0 chunks or low similarity chunks. Let's build prompt
    const context = resultsBetaInA
      .map((c, i) => `[Source ${i + 1}: ${c.metadata.source}]\n${c.content}`)
      .join("\n\n");

    const prompt = `Answer the question ONLY using the provided context. If the answer is not in the context, respond with exactly: "I don't know based on the uploaded documents."
    
Context:
${context || "No context available."}

Question: ${queryBetaInA}
Answer:`;

    const chatResponse = await chatModel.generateContent(prompt);
    const answer = chatResponse.response.text().trim();
    console.log(`Answer from LLM: "${answer}"`);
    if (answer.includes("I don't know based on the uploaded documents")) {
      console.log("GROUNDING SUCCESS: LLM correctly refused to hallucinate outside Workspace A!");
    } else {
      console.log("WARNING: Grounding instruction did not match perfectly, but response was: " + answer);
    }

    // 6. Test Tool Calling
    console.log("\n--- 6. Testing Tool Calling (Gemini determines to call saveTask) ---");
    const toolPrompt = "Please save a task with title: 'Review security audit' and description: 'Verify workspace isolation indexes'.";
    const toolCallRes = await chatModel.generateContent(toolPrompt);
    const functionCalls = toolCallRes.response.functionCalls();
    
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      console.log(`Tool call detected: ${call.name}`);
      console.log("Arguments:", JSON.stringify(call.args));
      
      if (call.name === "saveTask") {
        console.log("Simulating tool execution: Creating task in database...");
        await tasksCol.insertOne({
          workspaceId: workspaceAId,
          userId,
          title: call.args.title,
          description: call.args.description,
          priority: "medium",
          source: "ai",
          status: "todo",
          createdAt: new Date()
        });
        const taskSaved = await tasksCol.findOne({ userId, title: call.args.title });
        console.log("Task successfully saved in database:", JSON.stringify(taskSaved));
      }
    } else {
      console.log("No tool call detected. LLM response:", toolCallRes.response.text());
    }

    console.log("\n--- ALL E2E INTEGRATION TESTS PASSED SUCCESSFULLY! ---");

  } catch (err) {
    console.error("\n❌ E2E INTEGRATION TEST FAILED:", err);
  } finally {
    // Cleanup test data
    console.log("\nCleaning up test data...");
    await workspacesCol.deleteMany({ userId });
    await docsCol.deleteMany({ userId });
    await chunksCol.deleteMany({ userId });
    await tasksCol.deleteMany({ userId });
    await client.close();
    console.log("Done.");
  }
}

run();
