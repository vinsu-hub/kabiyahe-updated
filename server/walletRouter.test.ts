import { describe, expect, it } from "vitest";
import { decodeWalletImage } from "./walletRouter";

const validPng = "iVBORw0KGgo=";

describe("wallet ticket attachment validation", () => {
  it("accepts a valid PNG payload", () => {
    expect(decodeWalletImage(validPng, "image/png").length).toBeGreaterThan(0);
  });

  it("rejects unsupported MIME types", () => {
    expect(() => decodeWalletImage(validPng, "application/pdf")).toThrow(/JPG or PNG/);
  });

  it("rejects malformed base64 payloads", () => {
    expect(() => decodeWalletImage("not base64?", "image/png")).toThrow(/payload is invalid/);
  });

  it("rejects payloads larger than 10 MB", () => {
    const oversized = Buffer.alloc(10 * 1024 * 1024 + 1).toString("base64");
    expect(() => decodeWalletImage(oversized, "image/jpeg")).toThrow(/smaller than 10 MB/);
  });
});
