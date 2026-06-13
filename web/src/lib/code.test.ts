import { describe, it, expect } from "vitest";
import { genCode, normalizeCode, formatCode, codeFromText } from "@/lib/code";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

describe("genCode", () => {
  it("returns a 6-character string", () => {
    expect(genCode()).toHaveLength(6);
  });

  it("only uses characters from the allowed alphabet", () => {
    for (let i = 0; i < 50; i++) {
      const code = genCode();
      for (const char of code) {
        expect(ALPHABET).toContain(char);
      }
    }
  });

  it("produces different values across two calls", () => {
    expect(genCode()).not.toBe(genCode());
  });
});

describe("normalizeCode", () => {
  it("uppercases, strips non-alphanumerics, and slices to 6", () => {
    expect(normalizeCode("ab-c d!ef9g")).toBe("ABCDEF");
  });

  it("handles empty input", () => {
    expect(normalizeCode("")).toBe("");
  });
});

describe("formatCode", () => {
  it("inserts a dash after the third character", () => {
    expect(formatCode("ABCDEF")).toBe("ABC-DEF");
  });

  it("returns an empty string for empty input", () => {
    expect(formatCode("")).toBe("");
  });
});

describe("codeFromText", () => {
  it("extracts the trailing 6-character code and uppercases it", () => {
    expect(codeFromText("http://x/r?c=abc123")).toBe("ABC123");
  });

  it("returns null when there is no trailing code", () => {
    expect(codeFromText("hello")).toBeNull();
  });
});
