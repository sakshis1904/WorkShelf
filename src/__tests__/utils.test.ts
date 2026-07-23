import { formatBytes, truncate, slugify, generateWorkspaceColor } from "@/lib/utils";

describe("formatBytes", () => {
  it("returns '0 Bytes' for 0", () => {
    expect(formatBytes(0)).toBe("0 Bytes");
  });
  it("formats KB correctly", () => {
    expect(formatBytes(1024)).toBe("1 KB");
  });
  it("formats MB correctly", () => {
    expect(formatBytes(1048576)).toBe("1 MB");
  });
});

describe("truncate", () => {
  it("does not truncate short strings", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });
  it("truncates long strings", () => {
    expect(truncate("hello world", 5)).toBe("hello…");
  });
});

describe("slugify", () => {
  it("converts to lowercase with hyphens", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });
  it("removes special chars", () => {
    expect(slugify("My Workspace!")).toBe("my-workspace");
  });
});

describe("generateWorkspaceColor", () => {
  it("returns a hex color string", () => {
    const color = generateWorkspaceColor();
    expect(color).toMatch(/^#[0-9a-f]{6}$/i);
  });
});
