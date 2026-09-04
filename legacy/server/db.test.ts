import { describe, expect, it } from "vitest";
import { isTransientDbError } from "./db";

describe("database error classification", () => {
  it("recognizes direct and nested transient connection codes", () => {
    expect(isTransientDbError({ code: "ETIMEDOUT" })).toBe(true);
    expect(isTransientDbError({ cause: { code: "ECONNRESET" } })).toBe(true);
  });

  it("recognizes transient codes in wrapped database errors", () => {
    expect(isTransientDbError(new Error("connect ETIMEDOUT"))).toBe(true);
  });

  it("does not classify application errors as transient database failures", () => {
    expect(isTransientDbError(new Error("invalid oauth state"))).toBe(false);
    expect(isTransientDbError({ code: "ER_DUP_ENTRY" })).toBe(false);
  });
});
