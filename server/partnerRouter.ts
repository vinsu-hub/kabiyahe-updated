import { and, desc, eq, gte, isNull } from "drizzle-orm";
import { z } from "zod";
import { destinations, partnerAdminLog, partnerMetrics, partnerPhotos, partners } from "../drizzle/schema";
import { getDb } from "./db";
import { adminProcedure, partnerProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { storagePut } from "./storage";

const registrationInput = z.object({
  businessName: z.string().trim().min(2).max(180),
  partnerType: z.enum(["spot", "restaurant", "hotel", "guide"]),
  categories: z.string().trim().max(500).optional(),
  contactName: z.string().trim().min(2).max(160),
  contactEmail: z.string().email().max(320),
  contactPhone: z.string().trim().max(40).optional(),
  businessAddress: z.string().trim().min(3).max(1000),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  bookingUrl: z.string().url().max(500).optional().or(z.literal("")),
  description: z.string().trim().min(20).max(4000),
  businessPermitNumber: z.string().trim().min(3).max(120),
  photos: z.array(z.object({ fileName: z.string().trim().min(1).max(240), mimeType: z.enum(["image/jpeg", "image/png"]), dataBase64: z.string().min(100).max(14_000_000) })).max(5).optional(),
});

const dbRequired = async () => {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Partner data service is unavailable." });
  return db;
};

const ensurePartnerAccess = async (partnerId: number, userId: number) => {
  const db = await dbRequired();
  const result = await db.select().from(partners).where(eq(partners.id, partnerId)).limit(1);
  const partner = result[0];
  if (!partner || partner.ownerUserId !== userId) throw new TRPCError({ code: "FORBIDDEN", message: "You can only manage your own partner listing." });
  if (partner.status !== "active") throw new TRPCError({ code: "FORBIDDEN", message: "Your partner listing must be active before using this workspace." });
  return { db, partner };
};

export const partnerRouter = router({
  submitRegistration: publicProcedure.input(registrationInput).mutation(async ({ input }) => {
    const db = await dbRequired();
    const { photos = [], ...partnerInput } = input;
    const result = await db.insert(partners).values({ ...partnerInput, bookingUrl: input.bookingUrl || null, status: "pending" });
    const partnerId = Number(result[0].insertId);
    for (const photo of photos) {
      const data = Buffer.from(photo.dataBase64, "base64");
      if (data.byteLength > 10 * 1024 * 1024) throw new TRPCError({ code: "BAD_REQUEST", message: "Each partner photo must be 10 MB or smaller." });
      const uploaded = await storagePut(`partner-submissions/${partnerId}/${photo.fileName}`, data, photo.mimeType);
      await db.insert(partnerPhotos).values({ partnerId, storageKey: uploaded.key, url: uploaded.url, mimeType: photo.mimeType, fileName: photo.fileName });
    }
    return { id: partnerId, status: "pending" as const, photoCount: photos.length };
  }),
  uploadPhoto: partnerProcedure.input(z.object({ partnerId: z.number().int().positive(), fileName: z.string().trim().min(1).max(240), mimeType: z.enum(["image/jpeg", "image/png"]), dataBase64: z.string().min(100).max(14_000_000) })).mutation(async ({ input, ctx }) => {
    const { db } = await ensurePartnerAccess(input.partnerId, ctx.user.id);
    const data = Buffer.from(input.dataBase64, "base64");
    if (data.byteLength > 10 * 1024 * 1024) throw new TRPCError({ code: "BAD_REQUEST", message: "Each partner photo must be 10 MB or smaller." });
    const uploaded = await storagePut(`partners/${input.partnerId}/${input.fileName}`, data, input.mimeType);
    await db.insert(partnerPhotos).values({ partnerId: input.partnerId, storageKey: uploaded.key, url: uploaded.url, mimeType: input.mimeType, fileName: input.fileName });
    return uploaded;
  }),
  mine: partnerProcedure.query(async ({ ctx }) => {
    const db = await dbRequired();
    return db.select().from(partners).where(eq(partners.ownerUserId, ctx.user.id)).orderBy(desc(partners.updatedAt));
  }),
  updateListing: partnerProcedure.input(z.object({ id: z.number().int().positive(), businessName: z.string().trim().min(2).max(180), categories: z.string().trim().max(500).optional(), contactName: z.string().trim().min(2).max(160), contactEmail: z.string().email().max(320), contactPhone: z.string().trim().max(40).optional(), businessAddress: z.string().trim().min(3).max(1000), latitude: z.number().min(-90).max(90).optional(), longitude: z.number().min(-180).max(180).optional(), bookingUrl: z.string().url().max(500).optional().or(z.literal("")), description: z.string().trim().min(20).max(4000) })).mutation(async ({ input, ctx }) => {
    const { db } = await ensurePartnerAccess(input.id, ctx.user.id);
    await db.update(partners).set({ ...input, bookingUrl: input.bookingUrl || null, updatedAt: new Date() }).where(and(eq(partners.id, input.id), eq(partners.ownerUserId, ctx.user.id)));
    return { success: true } as const;
  }),
  metrics: partnerProcedure.input(z.object({ partnerId: z.number().int().positive(), range: z.enum(["7", "30", "all"]).default("30") })).query(async ({ input, ctx }) => {
    const { db } = await ensurePartnerAccess(input.partnerId, ctx.user.id);
    const since = input.range === "all" ? undefined : new Date(Date.now() - Number(input.range) * 86400000);
    return since ? db.select().from(partnerMetrics).where(and(eq(partnerMetrics.partnerId, input.partnerId), gte(partnerMetrics.metricDate, since))).orderBy(partnerMetrics.metricDate) : db.select().from(partnerMetrics).where(eq(partnerMetrics.partnerId, input.partnerId)).orderBy(partnerMetrics.metricDate);
  }),
  adminLog: adminProcedure.query(async () => {
    const db = await dbRequired();
    return db.select().from(partnerAdminLog).orderBy(desc(partnerAdminLog.createdAt));
  }),
  requestFeatured: partnerProcedure.input(z.object({ partnerId: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
    const { db } = await ensurePartnerAccess(input.partnerId, ctx.user.id);
    await db.update(partners).set({ visibilityTier: "featured", updatedAt: new Date() }).where(eq(partners.id, input.partnerId));
    return { success: true, visibilityTier: "featured" as const };
  }),
  adminQueue: adminProcedure.input(z.object({ status: z.enum(["all", "pending", "active", "rejected", "info_requested", "suspended", "deactivated"]).default("all") }).optional()).query(async ({ input }) => {
    const db = await dbRequired();
    const status = input?.status ?? "all";
    return status === "all" ? db.select().from(partners).orderBy(desc(partners.updatedAt)) : db.select().from(partners).where(eq(partners.status, status)).orderBy(desc(partners.updatedAt));
  }),
  review: adminProcedure.input(z.object({ partnerId: z.number().int().positive(), action: z.enum(["approved", "rejected", "info_requested", "suspended"]), reason: z.string().trim().max(1000).optional() })).mutation(async ({ input, ctx }) => {
    const db = await dbRequired();
    const status = input.action === "approved" ? "active" : input.action;
    await db.update(partners).set({ status, rejectionReason: input.reason || null, verifiedAt: input.action === "approved" ? new Date() : null, updatedAt: new Date() }).where(eq(partners.id, input.partnerId));
    await db.insert(partnerAdminLog).values({ partnerId: input.partnerId, adminUserId: ctx.user.id, action: input.action, reason: input.reason || null });
    return { success: true, status } as const;
  }),
  unclaimed: adminProcedure.query(async () => {
    const db = await dbRequired();
    return db.select().from(destinations).where(and(eq(destinations.status, "active"), isNull(destinations.claimedByPartnerId))).orderBy(desc(destinations.updatedAt));
  }),
  claim: partnerProcedure.input(z.object({ destinationId: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
    const db = await dbRequired();
    const destination = (await db.select().from(destinations).where(eq(destinations.id, input.destinationId)).limit(1))[0];
    if (!destination) throw new TRPCError({ code: "NOT_FOUND", message: "That listing could not be found." });
    if (destination.claimedByPartnerId) throw new TRPCError({ code: "CONFLICT", message: "That listing has already been claimed." });
    const created = await db.insert(partners).values({ ownerUserId: ctx.user.id, businessName: destination.name, partnerType: "spot", businessAddress: destination.address, description: destination.description, contactName: ctx.user.name || "Partner contact", contactEmail: ctx.user.email || "", linkedDestinationId: destination.id, status: "pending" });
    const partnerId = Number(created[0].insertId);
    await db.update(destinations).set({ claimedByPartnerId: partnerId, updatedAt: new Date() }).where(and(eq(destinations.id, destination.id), isNull(destinations.claimedByPartnerId)));
    return { success: true, partnerId, status: "pending" as const };
  }),
});
