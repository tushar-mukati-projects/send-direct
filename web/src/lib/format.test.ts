import { describe, it, expect } from "vitest";
import { fmtSize, fmtTime, extOf, fileCountLabel, sumSizes } from "@/lib/format";

describe("fmtSize", () => {
  it("returns '0 B' for null", () => {
    expect(fmtSize(null)).toBe("0 B");
  });

  it("returns '0 B' for undefined", () => {
    expect(fmtSize(undefined)).toBe("0 B");
  });

  it("formats bytes below 1 KB", () => {
    expect(fmtSize(500)).toBe("500 B");
  });

  it("formats kilobytes with no decimals (rounded)", () => {
    expect(fmtSize(1500)).toBe("2 KB");
  });

  it("formats megabytes with one decimal", () => {
    expect(fmtSize(1_500_000)).toBe("1.5 MB");
  });

  it("formats gigabytes with two decimals", () => {
    expect(fmtSize(2_000_000_000)).toBe("2.00 GB");
  });
});

describe("fmtTime", () => {
  it("formats zero seconds", () => {
    expect(fmtTime(0)).toBe("0s");
  });

  it("formats seconds under a minute", () => {
    expect(fmtTime(45)).toBe("45s");
  });

  it("formats minutes and seconds", () => {
    expect(fmtTime(90)).toBe("1m 30s");
  });
});

describe("extOf", () => {
  it("uppercases the extension", () => {
    expect(extOf("a.PNG")).toBe("PNG");
  });

  it("returns 'FILE' when there is no extension", () => {
    expect(extOf("Makefile")).toBe("FILE");
  });
});

describe("fileCountLabel", () => {
  it("uses the singular for a single file", () => {
    expect(fileCountLabel(1)).toBe("1 file");
  });

  it("uses the plural for multiple files", () => {
    expect(fileCountLabel(3)).toBe("3 files");
  });
});

describe("sumSizes", () => {
  it("sums the sizes of the given files", () => {
    expect(sumSizes([{ size: 1 }, { size: 2 }])).toBe(3);
  });
});
