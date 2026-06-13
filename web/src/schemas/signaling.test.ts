import { describe, it, expect } from "vitest";
import { serverMessageSchema, manifestSchema, dataControlSchema } from "@/schemas/signaling";

describe("serverMessageSchema", () => {
  it("accepts an offer message", () => {
    const result = serverMessageSchema.safeParse({
      type: "offer",
      sdp: { type: "offer", sdp: "v=0" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts an ice message", () => {
    const result = serverMessageSchema.safeParse({
      type: "ice",
      candidate: { candidate: "x" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts an error message", () => {
    const result = serverMessageSchema.safeParse({
      type: "error",
      reason: "room-full",
      message: "m",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown message type", () => {
    const result = serverMessageSchema.safeParse({ type: "nope" });
    expect(result.success).toBe(false);
  });
});

describe("manifestSchema", () => {
  it("parses a manifest with files", () => {
    const result = manifestSchema.safeParse({
      files: [{ id: "a", name: "file.txt", size: 10 }],
    });
    expect(result.success).toBe(true);
  });
});

describe("dataControlSchema", () => {
  it("parses a manifest control message", () => {
    expect(dataControlSchema.safeParse({ t: "manifest", files: [] }).success).toBe(true);
  });

  it("parses an accept control message", () => {
    expect(dataControlSchema.safeParse({ t: "accept" }).success).toBe(true);
  });

  it("parses a file-begin control message", () => {
    expect(dataControlSchema.safeParse({ t: "file-begin", id: "a" }).success).toBe(true);
  });

  it("parses an abort control message", () => {
    expect(dataControlSchema.safeParse({ t: "abort" }).success).toBe(true);
  });

  it("rejects an unknown control message type", () => {
    expect(dataControlSchema.safeParse({ t: "bogus" }).success).toBe(false);
  });
});
