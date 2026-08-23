import { describe, expect, it } from "vitest";
import { registerOAuthRoutes } from "./_core/oauth";

function registeredHandler() {
  let handler: any;
  registerOAuthRoutes({ get: (_path: string, callback: any) => { handler = callback; } } as any);
  return handler as (req: any, res: any) => Promise<void>;
}

function response() {
  const result: any = { statusCode: 200, body: null };
  result.status = (statusCode: number) => { result.statusCode = statusCode; return result; };
  result.json = (body: unknown) => { result.body = body; return result; };
  result.clearCookie = () => result;
  result.cookie = () => result;
  result.redirect = () => result;
  return result;
}

describe("OAuth callback failure handling", () => {
  it("returns 400 when code or state is missing", async () => {
    const res = response();
    await registeredHandler()({ query: {}, headers: {} }, res);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "code and state are required" });
  });

  it("returns 403 for malformed or unbound state before token exchange", async () => {
    const res = response();
    await registeredHandler()({ query: { code: "fake", state: "bad" }, headers: {} }, res);
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: "invalid oauth state" });
  });
});
