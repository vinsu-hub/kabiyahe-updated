import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const baseContext = (user: TrpcContext["user"]): TrpcContext => ({
  user,
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
});

describe("partners access control", () => {
  it("rejects anonymous partner data access", async () => {
    const caller = appRouter.createCaller(baseContext(null));
    await expect(caller.partners.mine()).rejects.toMatchObject<Partial<TRPCError>>({ code: "UNAUTHORIZED" });
  });

  it("rejects non-admin review queue access", async () => {
    const caller = appRouter.createCaller(appRouterContext("user"));
    await expect(caller.partners.adminQueue()).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
  });
});

function appRouterContext(role: "user" | "admin"): TrpcContext {
  return baseContext({
    id: role === "admin" ? 2 : 1,
    openId: `${role}-sample`,
    email: `${role}@example.com`,
    name: role === "admin" ? "Admin" : "Traveler",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  });
}
