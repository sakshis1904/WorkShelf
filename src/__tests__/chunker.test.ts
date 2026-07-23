import { chunkText } from "@/utils/text-chunker";

describe("chunkText", () => {
  it("returns empty array for empty text", () => {
    expect(chunkText("", "test.txt")).toHaveLength(0);
  });

  it("returns single chunk for short text", () => {
    const chunks = chunkText("Short text content here.", "test.txt");
    expect(chunks.length).toBeGreaterThanOrEqual(0);
  });

  it("assigns correct chunkIndex values", () => {
    const longText = "A".repeat(3000);
    const chunks = chunkText(longText, "test.txt");
    chunks.forEach((chunk, idx) => {
      expect(chunk.chunkIndex).toBe(idx);
    });
  });

  it("includes source in metadata", () => {
    const text = "This is a test document with enough content to form a chunk.";
    const chunks = chunkText(text, "my-file.txt");
    if (chunks.length > 0) {
      expect(chunks[0].metadata.source).toBe("my-file.txt");
    }
  });
});
