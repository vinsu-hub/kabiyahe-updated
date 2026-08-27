import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { destinations, feedPostNotifications, feedPosts, partners, users } from "../drizzle/schema";
import { getDb } from "./db";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";

const feedTypes = ["popup", "live_event", "promo", "cultural", "alert"] as const;
const feedSources = ["admin", "partner", "tourism_council"] as const;
const feedStatuses = ["pending_review", "live", "archived", "rejected"] as const;
export type FeedLifecycle = "happening_now" | "starting_soon" | "upcoming" | "past";

export function feedLifecycle(post: { startsAt: Date; endsAt: Date | null }, now = new Date()): FeedLifecycle {
  if (post.endsAt && post.endsAt.getTime() <= now.getTime()) return "past";
  if (post.startsAt.getTime() <= now.getTime()) return "happening_now";
  if (post.startsAt.getTime() - now.getTime() <= 24 * 60 * 60 * 1000) return "starting_soon";
  return "upcoming";
}

function urgencyRank(lifecycle: FeedLifecycle) {
  return lifecycle === "happening_now" ? 0 : lifecycle === "starting_soon" ? 1 : lifecycle === "upcoming" ? 2 : 3;
}

async function dbRequired() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Happening feed storage is temporarily unavailable." });
  return db;
}

type FeedJoinRow = {
  post: typeof feedPosts.$inferSelect;
  destinationName: string | null;
  destinationAddress: string | null;
  partnerName: string | null;
  partnerAddress: string | null;
};

async function feedRows() {
  const db = await dbRequired();
  return db.select({
    post: feedPosts,
    destinationName: destinations.name,
    destinationAddress: destinations.address,
    partnerName: partners.businessName,
    partnerAddress: partners.businessAddress,
  }).from(feedPosts)
    .leftJoin(destinations, eq(feedPosts.destinationId, destinations.id))
    .leftJoin(partners, eq(feedPosts.partnerId, partners.id));
}

function normalizeRow(row: FeedJoinRow, now = new Date()) {
  const lifecycle = feedLifecycle(row.post, now);
  return { ...row.post, destinationName: row.destinationName, destinationAddress: row.destinationAddress, partnerName: row.partnerName, partnerAddress: row.partnerAddress, lifecycle };
}

async function notifyUsersForPost(feedPostId: number) {
  const db = await dbRequired();
  const existing = await db.select({ userId: feedPostNotifications.userId }).from(feedPostNotifications).where(eq(feedPostNotifications.feedPostId, feedPostId));
  const sent = new Set(existing.map(row => row.userId));
  const recipients = await db.select({ id: users.id }).from(users);
  const pending = recipients.filter(user => !sent.has(user.id)).map(user => ({ feedPostId, userId: user.id }));
  if (pending.length) await db.insert(feedPostNotifications).values(pending);
}

const feedFilterInput = z.object({
  type: z.enum(feedTypes).optional(),
  place: z.string().trim().max(100).optional(),
  view: z.enum(["live", "past"]).default("live"),
});

export const feedRouter = router({
  publicFeed: publicProcedure.input(feedFilterInput).query(async ({ input }) => {
    const rows = (await feedRows()).map(row => normalizeRow(row));
    const filtered = rows.filter(post => {
      if (input.view === "live" && (post.status !== "live" || post.lifecycle === "past")) return false;
      if (input.view === "past" && !(post.status === "archived" || (post.status === "live" && post.lifecycle === "past"))) return false;
      if (input.type && post.type !== input.type) return false;
      if (input.place) {
        const haystack = [post.destinationName, post.destinationAddress, post.partnerName, post.partnerAddress].filter(Boolean).join(" ").toLowerCase();
        if (!haystack.includes(input.place.toLowerCase())) return false;
      }
      return true;
    });
    filtered.sort((a, b) => input.view === "past"
      ? (b.endsAt?.getTime() || b.startsAt.getTime()) - (a.endsAt?.getTime() || a.startsAt.getTime())
      : urgencyRank(a.lifecycle) - urgencyRank(b.lifecycle) || a.startsAt.getTime() - b.startsAt.getTime());
    return filtered;
  }),

  publicPost: publicProcedure.input(z.object({ id: z.number().int().positive(), view: z.enum(["live", "past"]).default("live") })).query(async ({ input }) => {
    const post = (await feedRows()).map(row => normalizeRow(row)).find(row => row.id === input.id);
    if (!post || post.status === "pending_review" || post.status === "rejected" || (input.view === "live" && post.lifecycle === "past")) {
      throw new TRPCError({ code: "NOT_FOUND", message: "This Happening post is no longer available." });
    }
    if (input.view === "past" && post.lifecycle !== "past" && post.status !== "archived") {
      throw new TRPCError({ code: "NOT_FOUND", message: "This post is still in the live feed." });
    }
    return post;
  }),

  notifications: protectedProcedure.input(z.object({ unreadOnly: z.boolean().default(false) })).query(async ({ ctx, input }) => {
    const db = await dbRequired();
    return db.select({
      id: feedPostNotifications.id,
      feedPostId: feedPostNotifications.feedPostId,
      sentAt: feedPostNotifications.sentAt,
      readAt: feedPostNotifications.readAt,
      title: feedPosts.title,
      type: feedPosts.type,
      startsAt: feedPosts.startsAt,
      status: feedPosts.status,
    }).from(feedPostNotifications)
      .innerJoin(feedPosts, eq(feedPostNotifications.feedPostId, feedPosts.id))
      .where(input.unreadOnly ? and(eq(feedPostNotifications.userId, ctx.user.id), isNull(feedPostNotifications.readAt)) : eq(feedPostNotifications.userId, ctx.user.id))
      .orderBy(desc(feedPostNotifications.createdAt));
  }),

  markNotificationRead: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await dbRequired();
    await db.update(feedPostNotifications).set({ readAt: new Date() }).where(and(eq(feedPostNotifications.id, input.id), eq(feedPostNotifications.userId, ctx.user.id)));
    return { success: true } as const;
  }),

  markAllNotificationsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await dbRequired();
    await db.update(feedPostNotifications).set({ readAt: new Date() }).where(and(eq(feedPostNotifications.userId, ctx.user.id), isNull(feedPostNotifications.readAt)));
    return { success: true } as const;
  }),

  adminList: adminProcedure.input(z.object({ status: z.enum(feedStatuses).optional() })).query(async ({ input }) => {
    const rows = (await feedRows()).map(row => normalizeRow(row));
    return rows.filter(post => !input.status || post.status === input.status).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }),

  adminCreate: adminProcedure.input(z.object({
    type: z.enum(feedTypes), title: z.string().trim().min(4).max(220), description: z.string().trim().min(10).max(2000),
    coverPhoto: z.string().url().optional(), destinationId: z.number().int().positive().optional(), partnerId: z.number().int().positive().optional(),
    startsAt: z.coerce.date(), endsAt: z.coerce.date().nullable().optional(), outboundLink: z.string().url().optional(), source: z.enum(feedSources).default("admin"),
  })).mutation(async ({ ctx, input }) => {
    if (input.endsAt && input.endsAt <= input.startsAt) throw new TRPCError({ code: "BAD_REQUEST", message: "The ending time must be after the starting time." });
    const db = await dbRequired();
    const result = await db.insert(feedPosts).values({ ...input, status: "live", createdBy: ctx.user.id, boosted: 0, endsAt: input.endsAt ?? null }).$returningId();
    const id = Number(result[0]?.id);
    if (!id) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The Happening post could not be created." });
    await notifyUsersForPost(id);
    return { id } as const;
  }),

  adminUpdate: adminProcedure.input(z.object({
    id: z.number().int().positive(), type: z.enum(feedTypes).optional(), title: z.string().trim().min(4).max(220).optional(), description: z.string().trim().min(10).max(2000).optional(),
    coverPhoto: z.string().url().nullable().optional(), destinationId: z.number().int().positive().nullable().optional(), partnerId: z.number().int().positive().nullable().optional(),
    startsAt: z.coerce.date().optional(), endsAt: z.coerce.date().nullable().optional(), outboundLink: z.string().url().nullable().optional(), source: z.enum(feedSources).optional(),
  })).mutation(async ({ input }) => {
    if (input.endsAt && input.startsAt && input.endsAt <= input.startsAt) throw new TRPCError({ code: "BAD_REQUEST", message: "The ending time must be after the starting time." });
    const { id, ...values } = input;
    const db = await dbRequired();
    await db.update(feedPosts).set({ ...values, updatedAt: new Date() }).where(eq(feedPosts.id, id));
    return { success: true } as const;
  }),

  adminSetStatus: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(feedStatuses) })).mutation(async ({ input }) => {
    const db = await dbRequired();
    await db.update(feedPosts).set({ status: input.status, updatedAt: new Date() }).where(eq(feedPosts.id, input.id));
    if (input.status === "live") await notifyUsersForPost(input.id);
    return { success: true } as const;
  }),
});
