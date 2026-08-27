import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { TRPCError } from "@trpc/server";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const baseContext = (user: TrpcContext["user"]): TrpcContext => ({
  user,
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
});

const partnerContext = (role: "user" | "partner" | "admin"): TrpcContext => baseContext({
  id: role === "admin" ? 2 : role === "partner" ? 3 : 1,
  openId: `${role}-reservation-test`,
  email: `${role}@example.com`,
  name: role,
  loginMethod: "test",
  role,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
});

describe("partner reservation intake contracts", () => {
  const routerSource = readFileSync(resolve(process.cwd(), "server/reservationRouter.ts"), "utf8");
  const schemaSource = readFileSync(resolve(process.cwd(), "drizzle/schema.ts"), "utf8");
  const portalSource = readFileSync(resolve(process.cwd(), "client/src/pages/PartnerPortal.tsx"), "utf8");
  const appSource = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");

  it("rejects anonymous and traveler access before any reservation data is returned", async () => {
    const anonymous = appRouter.createCaller(baseContext(null));
    await expect(anonymous.reservations.list({ partnerId: 1 })).rejects.toMatchObject<Partial<TRPCError>>({ code: "UNAUTHORIZED" });
    const traveler = appRouter.createCaller(partnerContext("user"));
    await expect(traveler.reservations.list({ partnerId: 1 })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
  });

  it("defines partner-owned reservation routes and explicit status transitions", () => {
    expect(routerSource).toContain("partnerAccess(input.partnerId, ctx.user)");
    expect(routerSource).toContain('status: z.enum(reservationStatuses)');
    expect(routerSource).toContain('requested: ["requested", "confirmed", "cancelled"]');
    expect(routerSource).toContain('confirmed: ["confirmed", "completed", "cancelled", "no_show"]');
    expect(routerSource).toContain('`New reservation request from ${input.guestName}.`');
    expect(routerSource).toContain('`Reservation #${input.id} was cancelled.`');
  });

  it("keeps reservation records, inventory, availability, notifications, and staff additive", () => {
    for (const table of ["inventoryUnits", "availabilityBlocks", "reservations", "partnerNotifications", "partnerStaff"]) {
      expect(schemaSource).toContain(`export const ${table}`);
    }
    expect(schemaSource).toContain("listingSubtype");
    expect(schemaSource).toContain("acceptReservations");
    expect(routerSource).toContain("if (!partner.acceptReservations)");
  });

  it("exposes the category-aware dashboard pages and scope-safe UI copy", () => {
    for (const route of ["/partners/reservations", "/partners/availability", "/partners/inventory", "/partners/notifications", "/partners/analytics", "/partners/settings"]) {
      expect(portalSource).toContain(`href:\"${route}\"`);
    }
    expect(appSource).toContain("path=\"/partners/reserve/:id\"");
    expect(portalSource).toContain("External Airbnb or venue booking links remain available separately.");
    expect(portalSource).toContain("Send reservation request");
    expect(portalSource).toContain("MessageSquare");
    expect(portalSource).toContain("It does not collect payments, card details, deposits, refunds, or external calendar feeds.");
  });
});
