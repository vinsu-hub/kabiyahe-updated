import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { appRouter } from "./routers";
import { assertPartnerRole } from "./_core/trpc";
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

  it("rejects a traveler account from partner-owned procedures", async () => {
    const caller = appRouter.createCaller(appRouterContext("user"));
    await expect(caller.partners.mine()).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    await expect(caller.partners.claim({ destinationId: 104 })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
  });

  it("allows a partner role through authorization before database access", () => {
    expect(assertPartnerRole(appRouterContext("partner").user)).toMatchObject({ role: "partner" });
  });

  it("allows an admin role through authorization before database access", () => {
    expect(assertPartnerRole(appRouterContext("admin").user)).toMatchObject({ role: "admin" });
  });
});

function appRouterContext(role: "user" | "partner" | "admin"): TrpcContext {
  return baseContext({
    id: role === "admin" ? 2 : role === "partner" ? 3 : 1,
    openId: `${role}-sample`,
    email: `${role}@example.com`,
    name: role === "admin" ? "Admin" : role === "partner" ? "Partner" : "Traveler",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  });
}
