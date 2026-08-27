import { describe, expect, it } from "vitest";
import { feedLifecycle } from "./feedRouter";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const appSource = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");
const routerSource = readFileSync(resolve(process.cwd(), "server/feedRouter.ts"), "utf8");

describe("Happening feed contracts", () => {
  const now = new Date("2026-08-28T00:00:00.000Z");

  it("computes live, starting soon, upcoming, and past states from timestamps", () => {
    expect(feedLifecycle({ startsAt: new Date("2026-08-27T23:00:00.000Z"), endsAt: new Date("2026-08-28T04:00:00.000Z") }, now)).toBe("happening_now");
    expect(feedLifecycle({ startsAt: new Date("2026-08-28T18:00:00.000Z"), endsAt: new Date("2026-08-28T20:00:00.000Z") }, now)).toBe("starting_soon");
    expect(feedLifecycle({ startsAt: new Date("2026-09-10T18:00:00.000Z"), endsAt: null }, now)).toBe("upcoming");
    expect(feedLifecycle({ startsAt: new Date("2026-08-27T18:00:00.000Z"), endsAt: new Date("2026-08-27T20:00:00.000Z") }, now)).toBe("past");
  });

  it("keeps open-ended alerts live after their start time", () => {
    expect(feedLifecycle({ startsAt: new Date("2026-08-27T18:00:00.000Z"), endsAt: null }, now)).toBe("happening_now");
  });

  it("exposes the public feed, past archive, detail, bell, and admin routes", () => {
    expect(appSource).toContain("path=\"/happening\"");
    expect(appSource).toContain("path=\"/happening/past\"");
    expect(appSource).toContain("path=\"/happening/:id\"");
    expect(appSource).toContain("HappeningNotificationBell");
    expect(appSource).toContain("HappeningStrip");
    expect(appSource).toContain("path=\"/partners/admin/happening\"");
  });

  it("keeps write procedures admin-only and notification reads user-scoped", () => {
    expect(routerSource).toContain("adminCreate: adminProcedure");
    expect(routerSource).toContain("adminUpdate: adminProcedure");
    expect(routerSource).toContain("adminSetStatus: adminProcedure");
    expect(routerSource).toContain("notifications: protectedProcedure");
    expect(routerSource).toContain("eq(feedPostNotifications.userId, ctx.user.id)");
    expect(routerSource).toContain("isNull(feedPostNotifications.readAt)");
  });

  it("excludes stale live posts from the default live feed and keeps past records in the archive", () => {
    expect(routerSource).toContain('post.status !== "live" || post.lifecycle === "past"');
    expect(routerSource).toContain('post.status === "archived" || (post.status === "live" && post.lifecycle === "past")');
  });
});
