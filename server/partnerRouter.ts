import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { partnerAdminLog, partnerPhotos, partners } from "../drizzle/schema";
import { getDb } from "./db";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
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
  return { db, partner };
};

export const partnerRouter = router({
  submitRegistration: publicProcedure.input(registrationInput).mutation(async ({ input }) => {
    const db = await dbRequired();
    const result = await db.insert(partners).values({ ...input, bookingUrl: input.bookingUrl || null, status: "pending" });
    return { id: Number(result[0].insertId), status: "pending" as const };
  }),
  uploadPhoto: protectedProcedure.input(z.object({ partnerId: z.number().int().positive(), fileName: z.string().trim().min(1).max(240), mimeType: z.enum(["image/jpeg", "image/png"]), dataBase64: z.string().min(100).max(14_000_000) })).mutation(async ({ input, ctx }) => {
    const { db } = await ensurePartnerAccess(input.partnerId, ctx.user.id);
    const data = Buffer.from(input.dataBase64, "base64");
    if (data.byteLength > 10 * 1024 * 1024) throw new TRPCError({ code: "BAD_REQUEST", message: "Each partner photo must be 10 MB or smaller." });
    const uploaded = await storagePut(`partners/${input.partnerId}/${input.fileName}`, data, input.mimeType);
    await db.insert(partnerPhotos).values({ partnerId: input.partnerId, storageKey: uploaded.key, url: uploaded.url, mimeType: input.mimeType, fileName: input.fileName });
    return uploaded;
  }),
  mine: protectedProcedure.query(async ({ ctx }) => {
    const db = await dbRequired();
    return db.select().from(partners).where(eq(partners.ownerUserId, ctx.user.id)).orderBy(desc(partners.updatedAt));
  }),
  updateListing: protectedProcedure.input(z.object({ id: z.number().int().positive(), businessName: z.string().trim().min(2).max(180), categories: z.string().trim().max(500).optional(), contactName: z.string().trim().min(2).max(160), contactEmail: z.string().email().max(320), contactPhone: z.string().trim().max(40).optional(), businessAddress: z.string().trim().min(3).max(1000), latitude: z.number().min(-90).max(90).optional(), longitude: z.number().min(-180).max(180).optional(), bookingUrl: z.string().url().max(500).optional().or(z.literal("")), description: z.string().trim().min(20).max(4000) })).mutation(async ({ input, ctx }) => {
    const { db } = await ensurePartnerAccess(input.id, ctx.user.id);
    await db.update(partners).set({ ...input, bookingUrl: input.bookingUrl || null, updatedAt: new Date() }).where(and(eq(partners.id, input.id), eq(partners.ownerUserId, ctx.user.id)));
    return { success: true } as const;
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
  claim: protectedProcedure.input(z.object({ partnerId: z.number().int().positive(), destinationId: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
    const { db } = await ensurePartnerAccess(input.partnerId, ctx.user.id);
    await db.update(partners).set({ linkedDestinationId: input.destinationId, updatedAt: new Date() }).where(eq(partners.id, input.partnerId));
    return { success: true } as const;
  }),
});
