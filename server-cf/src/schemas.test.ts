import { describe, it, expect } from "vitest";
import { clientMessageSchema } from "./schemas";

describe("clientMessageSchema", () => {
  it("accepts a valid create message", () => {
    const result = clientMessageSchema.safeParse({ type: "create", code: "ABC123" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({ type: "create", code: "ABC123" });
  });

  it("normalizes a lowercase code to uppercase", () => {
    const result = clientMessageSchema.safeParse({ type: "create", code: "abc123" });
    expect(result.success).toBe(true);
    if (result.success && result.data.type === "create") {
      expect(result.data.code).toBe("ABC123");
    }
  });

  it("trims surrounding whitespace before validating the code", () => {
    const result = clientMessageSchema.safeParse({ type: "join", code: "  abc123  " });
    expect(result.success).toBe(true);
    if (result.success && result.data.type === "join") {
      expect(result.data.code).toBe("ABC123");
    }
  });

  it("rejects a code that is too short", () => {
    const result = clientMessageSchema.safeParse({ type: "create", code: "ABC12" });
    expect(result.success).toBe(false);
  });

  it("accepts an offer message", () => {
    const result = clientMessageSchema.safeParse({
      type: "offer",
      sdp: { type: "offer", sdp: "v=0" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts an answer message", () => {
    const result = clientMessageSchema.safeParse({
      type: "answer",
      sdp: { type: "answer", sdp: "v=0" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts an ice message", () => {
    const result = clientMessageSchema.safeParse({
      type: "ice",
      candidate: { candidate: "x" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts a bye message", () => {
    const result = clientMessageSchema.safeParse({ type: "bye" });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown message type", () => {
    const result = clientMessageSchema.safeParse({ type: "nope" });
    expect(result.success).toBe(false);
  });
});
