import { and, desc, eq, gte, isNull, ne, or } from "drizzle-orm";
import { z } from "zod";
import {
  availabilityBlocks,
  inventoryUnits,
  partnerNotifications,
  partnerStaff,
  partners,
  reservations,
  users,
} from "../drizzle/schema";
import { getDb } from "./db";
import { adminProcedure, partnerProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";

const reservationStatuses = ["requested", "confirmed", "completed", "cancelled", "no_show"] as const;
const activeStatuses = ["requested", "confirmed"] as const;
const inventoryTypes = ["room_type", "vacation_unit", "table_category", "menu_highlight"] as const;

const dbRequired = async () => {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Reservation data service is unavailable." });
  return db;
};

const overlap = (start: Date, end: Date | null, otherStart: Date, otherEnd: Date | null) => {
  const startMs = start.getTime();
  const endMs = (end || start).getTime();
  const otherStartMs = otherStart.getTime();
  const otherEndMs = (otherEnd || otherStart).getTime();
  return startMs < otherEndMs && otherStartMs < endMs || startMs === otherStartMs;
};

async function partnerAccess(partnerId: number, user: { id: number; role: string }, ownerOnly = false) {
  const db = await dbRequired();
  const partner = (await db.select().from(partners).where(eq(partners.id, partnerId)).limit(1))[0];
  if (!partner) throw new TRPCError({ code: "NOT_FOUND", message: "Partner listing not found." });
  if (user.role === "admin") return { db, partner, accessRole: "admin" as const };
  if (partner.ownerUserId === user.id) return { db, partner, accessRole: "owner" as const };
  const staff = (await db.select().from(partnerStaff).where(and(eq(partnerStaff.partnerId, partnerId), eq(partnerStaff.userId, user.id))).limit(1))[0];
  if (!staff || ownerOnly) throw new TRPCError({ code: "FORBIDDEN", message: ownerOnly ? "Only the listing owner can manage this setting." : "You are not authorized to manage this partner listing." });
  return { db, partner, accessRole: "staff" as const };
}

async function ensureAvailable(db: Awaited<ReturnType<typeof getDb>>, input: { partnerId: number; inventoryUnitId?: number; dateStart: Date; dateEnd?: Date; id?: number }) {
  if (!db || !input.inventoryUnitId) return;
  const unit = (await db.select().from(inventoryUnits).where(and(eq(inventoryUnits.id, input.inventoryUnitId), eq(inventoryUnits.partnerId, input.partnerId), eq(inventoryUnits.active, 1))).limit(1))[0];
  if (!unit) throw new TRPCError({ code: "BAD_REQUEST", message: "That inventory unit is not available for this partner." });
  const blocks = await db.select().from(availabilityBlocks).where(and(eq(availabilityBlocks.partnerId, input.partnerId), or(eq(availabilityBlocks.inventoryUnitId, input.inventoryUnitId), isNull(availabilityBlocks.inventoryUnitId))));
  if (blocks.some(block => overlap(input.dateStart, input.dateEnd || null, block.dateStart, block.dateEnd))) {
    throw new TRPCError({ code: "CONFLICT", message: "The selected dates are blocked for this inventory." });
  }
  const active = await db.select().from(reservations).where(and(eq(reservations.partnerId, input.partnerId), eq(reservations.inventoryUnitId, input.inventoryUnitId), or(eq(reservations.status, "requested"), eq(reservations.status, "confirmed")), input.id ? ne(reservations.id, input.id) : undefined));
  const conflicts = active.filter(existing => overlap(input.dateStart, input.dateEnd || null, existing.dateStart, existing.dateEnd));
  if (conflicts.length >= unit.quantityAvailable) {
    throw new TRPCError({ code: "CONFLICT", message: `No ${unit.name} availability remains for the selected dates.` });
  }
}

async function notifyPartner(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, partnerId: number, type: "new_reservation" | "cancellation" | "review_flag" | "admin_message", message: string, reservationId?: number) {
  await db.insert(partnerNotifications).values({ partnerId, type, reservationId: reservationId || null, message });
}

const reservationInput = z.object({
  partnerId: z.number().int().positive(),
  destinationId: z.number().int().positive().optional(),
  inventoryUnitId: z.number().int().positive().optional(),
  guestName: z.string().trim().min(2).max(180),
  guestContact: z.string().trim().min(3).max(320),
  partySize: z.number().int().min(1).max(100),
  roomOrTableRef: z.string().trim().max(180).optional(),
  dateStart: z.coerce.date(),
  dateEnd: z.coerce.date().optional(),
  timeSlot: z.string().trim().max(80).optional(),
  source: z.enum(["kabiyahe_direct", "itinerary_linked"]).default("kabiyahe_direct"),
  notes: z.string().trim().max(2000).optional(),
});

export const reservationRouter = router({
  publicListing: publicProcedure.input(z.object({ partnerId: z.number().int().positive() })).query(async ({ input }) => {
    const db = await dbRequired();
    const partner = (await db.select({ id: partners.id, businessName: partners.businessName, partnerType: partners.partnerType, listingSubtype: partners.listingSubtype, acceptReservations: partners.acceptReservations, businessAddress: partners.businessAddress, description: partners.description }).from(partners).where(and(eq(partners.id, input.partnerId), eq(partners.status, "active"))).limit(1))[0];
    if (!partner) throw new TRPCError({ code: "NOT_FOUND", message: "This partner listing is not available." });
    return partner;
  }),

  publicInventory: publicProcedure.input(z.object({ partnerId: z.number().int().positive() })).query(async ({ input }) => {
    const db = await dbRequired();
    const partner = (await db.select({ acceptReservations: partners.acceptReservations }).from(partners).where(and(eq(partners.id, input.partnerId), eq(partners.status, "active"))).limit(1))[0];
    if (!partner?.acceptReservations) return [];
    return db.select({ id: inventoryUnits.id, type: inventoryUnits.type, name: inventoryUnits.name, capacity: inventoryUnits.capacity, quantityAvailable: inventoryUnits.quantityAvailable, baseRateRange: inventoryUnits.baseRateRange }).from(inventoryUnits).where(and(eq(inventoryUnits.partnerId, input.partnerId), eq(inventoryUnits.active, 1))).orderBy(inventoryUnits.name);
  }),

  create: publicProcedure.input(reservationInput).mutation(async ({ input }) => {
    const db = await dbRequired();
    const partner = (await db.select().from(partners).where(eq(partners.id, input.partnerId)).limit(1))[0];
    if (!partner || partner.status !== "active") throw new TRPCError({ code: "NOT_FOUND", message: "This partner is not accepting reservations." });
    if (!partner.acceptReservations) throw new TRPCError({ code: "FORBIDDEN", message: "This listing currently uses an external booking channel." });
    if (input.dateEnd && input.dateEnd < input.dateStart) throw new TRPCError({ code: "BAD_REQUEST", message: "End date must be after the start date." });
    if (input.dateStart.getTime() < Date.now() - 86_400_000) throw new TRPCError({ code: "BAD_REQUEST", message: "Reservation date cannot be in the past." });
    await ensureAvailable(db, input);
    const inserted = await db.insert(reservations).values({ ...input, destinationId: input.destinationId || null, inventoryUnitId: input.inventoryUnitId || null, roomOrTableRef: input.roomOrTableRef || null, dateEnd: input.dateEnd || null, timeSlot: input.timeSlot || null, notes: input.notes || null });
    const id = Number(inserted[0].insertId);
    await notifyPartner(db, input.partnerId, "new_reservation", `New reservation request from ${input.guestName}.`, id);
    return { id, status: "requested" as const };
  }),

  list: partnerProcedure.input(z.object({ partnerId: z.number().int().positive(), status: z.enum(reservationStatuses).optional() })).query(async ({ input, ctx }) => {
    const { db } = await partnerAccess(input.partnerId, ctx.user);
    return db.select().from(reservations).where(input.status ? and(eq(reservations.partnerId, input.partnerId), eq(reservations.status, input.status)) : eq(reservations.partnerId, input.partnerId)).orderBy(desc(reservations.dateStart), desc(reservations.createdAt));
  }),

  getById: partnerProcedure.input(z.object({ partnerId: z.number().int().positive(), id: z.number().int().positive() })).query(async ({ input, ctx }) => {
    const { db } = await partnerAccess(input.partnerId, ctx.user);
    const reservation = (await db.select().from(reservations).where(and(eq(reservations.id, input.id), eq(reservations.partnerId, input.partnerId))).limit(1))[0];
    if (!reservation) throw new TRPCError({ code: "NOT_FOUND", message: "Reservation not found." });
    return reservation;
  }),

  updateStatus: partnerProcedure.input(z.object({ partnerId: z.number().int().positive(), id: z.number().int().positive(), status: z.enum(reservationStatuses), cancelledReason: z.string().trim().max(500).optional() })).mutation(async ({ input, ctx }) => {
    const { db } = await partnerAccess(input.partnerId, ctx.user);
    const reservation = (await db.select().from(reservations).where(and(eq(reservations.id, input.id), eq(reservations.partnerId, input.partnerId))).limit(1))[0];
    if (!reservation) throw new TRPCError({ code: "NOT_FOUND", message: "Reservation not found." });
    const allowed: Record<string, string[]> = { requested: ["requested", "confirmed", "cancelled"], confirmed: ["confirmed", "completed", "cancelled", "no_show"], completed: ["completed"], cancelled: ["cancelled"], no_show: ["no_show"] };
    if (!allowed[reservation.status]?.includes(input.status)) throw new TRPCError({ code: "BAD_REQUEST", message: `A ${reservation.status} reservation cannot become ${input.status}.` });
    if (input.status === "confirmed") await ensureAvailable(db, { partnerId: input.partnerId, inventoryUnitId: reservation.inventoryUnitId || undefined, dateStart: reservation.dateStart, dateEnd: reservation.dateEnd || undefined, id: reservation.id });
    await db.update(reservations).set({ status: input.status, cancelledReason: input.status === "cancelled" ? input.cancelledReason || null : null, updatedAt: new Date() }).where(and(eq(reservations.id, input.id), eq(reservations.partnerId, input.partnerId)));
    if (input.status === "cancelled") await notifyPartner(db, input.partnerId, "cancellation", `Reservation #${input.id} was cancelled.`, input.id);
    return { success: true, status: input.status } as const;
  }),

  inventory: partnerProcedure.input(z.object({ partnerId: z.number().int().positive(), activeOnly: z.boolean().default(true) })).query(async ({ input, ctx }) => {
    const { db } = await partnerAccess(input.partnerId, ctx.user);
    return db.select().from(inventoryUnits).where(input.activeOnly ? and(eq(inventoryUnits.partnerId, input.partnerId), eq(inventoryUnits.active, 1)) : eq(inventoryUnits.partnerId, input.partnerId)).orderBy(inventoryUnits.name);
  }),

  createInventory: partnerProcedure.input(z.object({ partnerId: z.number().int().positive(), type: z.enum(inventoryTypes), name: z.string().trim().min(2).max(180), capacity: z.number().int().min(1).max(1000), quantityAvailable: z.number().int().min(1).max(1000), baseRateRange: z.string().trim().max(120).optional() })).mutation(async ({ input, ctx }) => {
    const { db } = await partnerAccess(input.partnerId, ctx.user);
    const inserted = await db.insert(inventoryUnits).values({ partnerId: input.partnerId, type: input.type, name: input.name, capacity: input.capacity, quantityAvailable: input.quantityAvailable, baseRateRange: input.baseRateRange || null });
    return { id: Number(inserted[0].insertId) };
  }),

  updateInventory: partnerProcedure.input(z.object({ partnerId: z.number().int().positive(), id: z.number().int().positive(), name: z.string().trim().min(2).max(180), capacity: z.number().int().min(1).max(1000), quantityAvailable: z.number().int().min(1).max(1000), baseRateRange: z.string().trim().max(120).optional(), active: z.boolean() })).mutation(async ({ input, ctx }) => {
    const { db } = await partnerAccess(input.partnerId, ctx.user);
    await db.update(inventoryUnits).set({ name: input.name, capacity: input.capacity, quantityAvailable: input.quantityAvailable, baseRateRange: input.baseRateRange || null, active: input.active ? 1 : 0, updatedAt: new Date() }).where(and(eq(inventoryUnits.id, input.id), eq(inventoryUnits.partnerId, input.partnerId)));
    return { success: true } as const;
  }),

  availability: partnerProcedure.input(z.object({ partnerId: z.number().int().positive(), from: z.coerce.date(), to: z.coerce.date() })).query(async ({ input, ctx }) => {
    const { db } = await partnerAccess(input.partnerId, ctx.user);
    return db.select().from(availabilityBlocks).where(and(eq(availabilityBlocks.partnerId, input.partnerId), gte(availabilityBlocks.dateEnd, input.from))).orderBy(availabilityBlocks.dateStart);
  }),

  blockAvailability: partnerProcedure.input(z.object({ partnerId: z.number().int().positive(), inventoryUnitId: z.number().int().positive().optional(), dateStart: z.coerce.date(), dateEnd: z.coerce.date(), reason: z.string().trim().max(500).optional() })).mutation(async ({ input, ctx }) => {
    const { db } = await partnerAccess(input.partnerId, ctx.user);
    if (input.dateEnd <= input.dateStart) throw new TRPCError({ code: "BAD_REQUEST", message: "Availability block end must be after its start." });
    if (input.inventoryUnitId) {
      const unit = (await db.select().from(inventoryUnits).where(and(eq(inventoryUnits.id, input.inventoryUnitId), eq(inventoryUnits.partnerId, input.partnerId))).limit(1))[0];
      if (!unit) throw new TRPCError({ code: "BAD_REQUEST", message: "Inventory unit not found for this partner." });
    }
    const inserted = await db.insert(availabilityBlocks).values({ partnerId: input.partnerId, inventoryUnitId: input.inventoryUnitId || null, dateStart: input.dateStart, dateEnd: input.dateEnd, reason: input.reason || null, createdBy: ctx.user.id });
    return { id: Number(inserted[0].insertId) };
  }),

  removeAvailability: partnerProcedure.input(z.object({ partnerId: z.number().int().positive(), id: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
    const { db } = await partnerAccess(input.partnerId, ctx.user);
    await db.delete(availabilityBlocks).where(and(eq(availabilityBlocks.id, input.id), eq(availabilityBlocks.partnerId, input.partnerId)));
    return { success: true } as const;
  }),

  notifications: partnerProcedure.input(z.object({ partnerId: z.number().int().positive(), unreadOnly: z.boolean().default(false) })).query(async ({ input, ctx }) => {
    const { db } = await partnerAccess(input.partnerId, ctx.user);
    return db.select().from(partnerNotifications).where(input.unreadOnly ? and(eq(partnerNotifications.partnerId, input.partnerId), isNull(partnerNotifications.readAt)) : eq(partnerNotifications.partnerId, input.partnerId)).orderBy(desc(partnerNotifications.createdAt));
  }),

  markNotificationRead: partnerProcedure.input(z.object({ partnerId: z.number().int().positive(), id: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
    const { db } = await partnerAccess(input.partnerId, ctx.user);
    await db.update(partnerNotifications).set({ readAt: new Date() }).where(and(eq(partnerNotifications.id, input.id), eq(partnerNotifications.partnerId, input.partnerId)));
    return { success: true } as const;
  }),

  markAllNotificationsRead: partnerProcedure.input(z.object({ partnerId: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
    const { db } = await partnerAccess(input.partnerId, ctx.user);
    await db.update(partnerNotifications).set({ readAt: new Date() }).where(and(eq(partnerNotifications.partnerId, input.partnerId), isNull(partnerNotifications.readAt)));
    return { success: true } as const;
  }),

  analytics: partnerProcedure.input(z.object({ partnerId: z.number().int().positive(), from: z.coerce.date().optional() })).query(async ({ input, ctx }) => {
    const { db } = await partnerAccess(input.partnerId, ctx.user);
    const rows = await db.select().from(reservations).where(input.from ? and(eq(reservations.partnerId, input.partnerId), gte(reservations.createdAt, input.from)) : eq(reservations.partnerId, input.partnerId));
    const total = rows.length;
    const requested = rows.filter(row => row.status === "requested").length;
    const confirmed = rows.filter(row => row.status === "confirmed" || row.status === "completed").length;
    const cancelled = rows.filter(row => row.status === "cancelled").length;
    return { total, requested, confirmed, cancelled, conversionRate: total ? Math.round((confirmed / total) * 100) : 0, cancellationRate: total ? Math.round((cancelled / total) * 100) : 0 };
  }),

  updateSettings: partnerProcedure.input(z.object({ partnerId: z.number().int().positive(), listingSubtype: z.enum(["hotel_resort", "airbnb_host", "restaurant"]), acceptReservations: z.boolean() })).mutation(async ({ input, ctx }) => {
    const { db } = await partnerAccess(input.partnerId, ctx.user, true);
    await db.update(partners).set({ listingSubtype: input.listingSubtype, acceptReservations: input.acceptReservations ? 1 : 0, updatedAt: new Date() }).where(eq(partners.id, input.partnerId));
    return { success: true } as const;
  }),

  staff: partnerProcedure.input(z.object({ partnerId: z.number().int().positive() })).query(async ({ input, ctx }) => {
    const { db } = await partnerAccess(input.partnerId, ctx.user);
    return db.select({ id: partnerStaff.id, userId: partnerStaff.userId, role: partnerStaff.role, name: users.name, email: users.email }).from(partnerStaff).leftJoin(users, eq(users.id, partnerStaff.userId)).where(eq(partnerStaff.partnerId, input.partnerId));
  }),

  addStaff: partnerProcedure.input(z.object({ partnerId: z.number().int().positive(), email: z.string().email() })).mutation(async ({ input, ctx }) => {
    const { db } = await partnerAccess(input.partnerId, ctx.user, true);
    const user = (await db.select().from(users).where(eq(users.email, input.email)).limit(1))[0];
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "No Kabiyahe account was found for that email." });
    const existing = (await db.select().from(partnerStaff).where(and(eq(partnerStaff.partnerId, input.partnerId), eq(partnerStaff.userId, user.id))).limit(1))[0];
    if (existing) throw new TRPCError({ code: "CONFLICT", message: "That user already has access to this partner workspace." });
    const inserted = await db.insert(partnerStaff).values({ partnerId: input.partnerId, userId: user.id, role: "staff" });
    return { id: Number(inserted[0].insertId), userId: user.id };
  }),

  removeStaff: partnerProcedure.input(z.object({ partnerId: z.number().int().positive(), staffId: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
    const { db } = await partnerAccess(input.partnerId, ctx.user, true);
    await db.delete(partnerStaff).where(and(eq(partnerStaff.id, input.staffId), eq(partnerStaff.partnerId, input.partnerId)));
    return { success: true } as const;
  }),

  adminAll: adminProcedure.input(z.object({ status: z.enum(reservationStatuses).optional() })).query(async ({ input }) => {
    const db = await dbRequired();
    const rows = await db.select().from(reservations).where(input.status ? eq(reservations.status, input.status) : undefined).orderBy(desc(reservations.createdAt));
    const partnerRows = rows.length ? await db.select({ id: partners.id, businessName: partners.businessName, partnerType: partners.partnerType }).from(partners) : [];
    return rows.map(row => ({ ...row, partnerName: partnerRows.find(partner => partner.id === row.partnerId)?.businessName || `Partner #${row.partnerId}`, partnerType: partnerRows.find(partner => partner.id === row.partnerId)?.partnerType || "partner" }));
  }),
});
