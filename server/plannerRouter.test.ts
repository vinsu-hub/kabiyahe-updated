import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { addStopInput, buildVerifiedStops, hasForeignStopIds, isDuplicateDestination, isStopOwned, normalizeInsertId, parseContent, reorderStopsInput } from "./plannerRouter";
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

  it("rejects missing or invalid database insert IDs instead of producing NaN", () => {
    expect(() => normalizeInsertId(undefined)).toThrow("created trip ID");
    expect(() => normalizeInsertId("not-a-number")).toThrow("created trip ID");
    expect(() => normalizeInsertId(0)).toThrow("created trip ID");
    expect(normalizeInsertId("42")).toBe(42);
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
  }, 15_000);
});

describe("generated stop editing authorization", () => {
  it("rejects duplicate stop ids before reorder persistence", () => {
    expect(reorderStopsInput.safeParse({ tripId: 1, stops: [{ id: 2, dayNumber: 1, stopOrder: 1 }, { id: 2, dayNumber: 1, stopOrder: 2 }] }).success).toBe(false);
  });

  it("rejects invalid add-stop day and blank time payloads", () => {
    expect(addStopInput.safeParse({ tripId: 1, destinationId: 1, dayNumber: 0, timeLabel: "" }).success).toBe(false);
  });

  it("detects foreign and missing stop ownership before mutation", () => {
    expect(hasForeignStopIds([11, 12], [11])).toBe(true);
    expect(isStopOwned([11, 12], 13)).toBe(false);
  });

  it("detects duplicate destinations before add-stop insertion", () => {
    expect(isDuplicateDestination([3, 7], 7)).toBe(true);
    expect(isDuplicateDestination([3, 7], 8)).toBe(false);
  });

  it("rejects an authenticated reorder for a missing or foreign trip", async () => {
    const caller = appRouter.createCaller(context(traveler));
    await expect(caller.planner.reorderStops({ tripId: 999999, stops: [{ id: 999999, dayNumber: 1, stopOrder: 1 }] })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("rejects a stop outside the caller-owned persisted trip", async () => {
    const caller = appRouter.createCaller(context(traveler));
    await expect(caller.planner.removeStop({ tripId: 1, stopId: 999999 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller.planner.reorderStops({ tripId: 1, stops: [{ id: 999999, dayNumber: 1, stopOrder: 1 }] })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects a new stop when the destination is not in the verified catalog", async () => {
    const caller = appRouter.createCaller(context(traveler));
    await expect(caller.planner.addStop({ tripId: 1, destinationId: 999999, dayNumber: 1, timeLabel: "09:00 AM" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("rejects anonymous stop removal", async () => {
    const caller = appRouter.createCaller(context(null));
    await expect(caller.planner.removeStop({ tripId: 1, stopId: 1 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects anonymous stop reorder", async () => {
    const caller = appRouter.createCaller(context(null));
    await expect(caller.planner.reorderStops({ tripId: 1, stops: [{ id: 1, dayNumber: 1, stopOrder: 1 }] })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects anonymous verified-stop creation", async () => {
    const caller = appRouter.createCaller(context(null));
    await expect(caller.planner.addStop({ tripId: 1, destinationId: 1, dayNumber: 1, timeLabel: "09:00 AM" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
