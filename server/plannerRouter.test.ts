import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { buildVerifiedStops, parseContent } from "./plannerRouter";
import type { TrpcContext } from "./_core/context";

const context = (user: TrpcContext["user"]): TrpcContext => ({
  user,
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
});

const traveler = {
  id: 11,
  openId: "planner-traveler",
  email: "planner@example.com",
  name: "Planner Traveler",
  loginMethod: "manus",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

describe("planner generation", () => {
  it("rejects anonymous generation", async () => {
    const caller = appRouter.createCaller(context(null));
    await expect(caller.planner.generate({
      startDate: "2025-06-12",
      endDate: "2025-06-13",
      travelers: 4,
      budgetLevel: 2,
      interests: ["Nature"],
      notes: "",
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects invalid date ranges before invoking persistence", async () => {
    const caller = appRouter.createCaller(context(traveler));
    await expect(caller.planner.generate({
      startDate: "2025-06-14",
      endDate: "2025-06-13",
      travelers: 4,
      budgetLevel: 2,
      interests: ["Nature"],
      notes: "",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("keeps only verified destination ids from a structured model response", () => {
    const parsed = parseContent(JSON.stringify({ days: [{ dayNumber: 1, stops: [{ destinationId: 1, timeLabel: "09:00 AM", rationale: "Verified stop" }, { destinationId: 999, timeLabel: "11:00 AM", rationale: "Unverified stop" }] }] }));
    expect(buildVerifiedStops(parsed, new Set([1, 2]), 42)).toEqual([{ tripId: 42, dayNumber: 1, stopOrder: 1, destinationId: 1, timeLabel: "09:00 AM", rationale: "Verified stop" }]);
  });

  it("returns active verified Laguna destinations for an authenticated planner", async () => {
    const caller = appRouter.createCaller(context(traveler));
    const verified = await caller.planner.verified();
    expect(verified.length).toBeGreaterThanOrEqual(4);
    expect(verified.every(destination => destination.name && destination.address)).toBe(true);
  });
});
