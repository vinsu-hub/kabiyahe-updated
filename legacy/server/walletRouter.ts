import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { walletTicketAttachments } from "../drizzle/schema";
import { getDb } from "./db";
import { storagePut } from "./storage";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const allowedMimeTypes = ["image/jpeg", "image/png"] as const;

export function decodeWalletImage(dataBase64: string, mimeType: string) {
  if (!allowedMimeTypes.includes(mimeType as (typeof allowedMimeTypes)[number])) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Ticket screenshots must be JPG or PNG images." });
  }
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(dataBase64) || dataBase64.length % 4 === 1) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "The ticket image payload is invalid." });
  }
  const bytes = Buffer.from(dataBase64, "base64");
  if (!bytes.length || bytes.length > MAX_FILE_SIZE) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Ticket screenshots must be smaller than 10 MB." });
  }
  return bytes;
}

const attachmentInput = z.object({
  tripId: z.string().trim().min(1).max(180),
  entryName: z.string().trim().min(1).max(180),
});

export const walletRouter = router({
  listAttachments: protectedProcedure.input(z.object({ tripId: z.string().trim().min(1).max(180) })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Wallet persistence is unavailable right now.");
    return db.select().from(walletTicketAttachments).where(and(eq(walletTicketAttachments.ownerUserId, ctx.user.id), eq(walletTicketAttachments.tripId, input.tripId)));
  }),

  uploadAttachment: protectedProcedure.input(attachmentInput.extend({
    fileName: z.string().trim().min(1).max(240),
    mimeType: z.string().trim().min(1).max(80),
    dataBase64: z.string().min(1).max(14_000_000),
  })).mutation(async ({ ctx, input }) => {
    const bytes = decodeWalletImage(input.dataBase64, input.mimeType);
    const db = await getDb();
    if (!db) throw new Error("Wallet persistence is unavailable right now.");
    const oldAttachments = await db.select({ id: walletTicketAttachments.id }).from(walletTicketAttachments).where(and(eq(walletTicketAttachments.ownerUserId, ctx.user.id), eq(walletTicketAttachments.tripId, input.tripId), eq(walletTicketAttachments.entryName, input.entryName)));
    const stored = await storagePut(`wallet-tickets/${ctx.user.id}/${input.tripId}/${input.entryName}-${input.fileName}`, bytes, input.mimeType);
    const inserted = await db.insert(walletTicketAttachments).values({ ownerUserId: ctx.user.id, tripId: input.tripId, entryName: input.entryName, storageKey: stored.key, url: stored.url, mimeType: input.mimeType, fileName: input.fileName, fileSize: bytes.length });
    if (oldAttachments.length) await db.delete(walletTicketAttachments).where(and(eq(walletTicketAttachments.ownerUserId, ctx.user.id), inArray(walletTicketAttachments.id, oldAttachments.map(item => item.id))));
    return { success: true as const, id: Number((inserted as { insertId?: number }).insertId), url: stored.url, fileName: input.fileName, fileSize: bytes.length };
  }),

  removeAttachment: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Wallet persistence is unavailable right now.");
    const deleted = await db.delete(walletTicketAttachments).where(and(eq(walletTicketAttachments.id, input.id), eq(walletTicketAttachments.ownerUserId, ctx.user.id)));
    if (!(deleted as { affectedRows?: number }).affectedRows) throw new TRPCError({ code: "NOT_FOUND", message: "Ticket attachment not found." });
    return { success: true as const };
  }),
});
