import { and, eq, inArray, max } from "drizzle-orm";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { destinations, generatedTripStops, generatedTrips } from "../drizzle/schema";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";

const plannerInput = z.object({
  startDate: z.string().date(),
  endDate: z.string().date(),
  travelers: z.number().int().min(1).max(12),
  budgetLevel: z.number().int().min(0).max(3),
  interests: z.array(z.string()).min(1).max(12),
  notes: z.string().max(1200).optional().default(""),
}).refine(value => value.endDate >= value.startDate, {
  message: "End date must be on or after the start date.",
  path: ["endDate"],
});

const reorderStopItem = z.object({ id: z.number().int().positive(), dayNumber: z.number().int().min(1), stopOrder: z.number().int().min(1) });
export const reorderStopsInput = z.object({ tripId: z.number().int().positive(), stops: z.array(reorderStopItem).min(1).max(50) }).superRefine((value, ctx) => {
  if (new Set(value.stops.map(stop => stop.id)).size !== value.stops.length) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Each itinerary stop can only appear once.", path: ["stops"] });
});
export const addStopInput = z.object({ tripId: z.number().int().positive(), destinationId: z.number().int().positive(), dayNumber: z.number().int().min(1), timeLabel: z.string().trim().min(1).max(40), rationale: z.string().trim().max(1000).optional().default("Added from the verified Laguna destination catalog.") });

export function hasForeignStopIds(requestedIds: number[], ownedIds: number[]) {
  const owned = new Set(ownedIds);
  return requestedIds.some(id => !owned.has(id));
}

export function isDuplicateDestination(existingDestinationIds: number[], destinationId: number) {
  return existingDestinationIds.includes(destinationId);
}

export function isStopOwned(ownedIds: number[], stopId: number) {
  return ownedIds.includes(stopId);
}

const generatedShape = {
  days: {
    type: "array",
    minItems: 1,
    items: {
      type: "object",
      properties: {
        dayNumber: { type: "integer", minimum: 1 },
        stops: {
          type: "array",
          minItems: 1,
          maxItems: 6,
          items: {
            type: "object",
            properties: {
              destinationId: { type: "integer" },
              timeLabel: { type: "string" },
              rationale: { type: "string" },
            },
            required: ["destinationId", "timeLabel", "rationale"],
            additionalProperties: false,
          },
        },
      },
      required: ["dayNumber", "stops"],
      additionalProperties: false,
    },
  },
};

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return Promise.race([promise, new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Itinerary generation timed out. Please try again.")), timeoutMs))]);
}

export function parseContent(content: unknown) {
  if (typeof content !== "string") throw new Error("The itinerary response was empty.");
  const parsed = JSON.parse(content) as { days: Array<{ dayNumber: number; stops: Array<{ destinationId: number; timeLabel: string; rationale: string }> }> };
  if (!Array.isArray(parsed.days) || parsed.days.length === 0) throw new Error("The itinerary response had no days.");
  return parsed;
}

export function normalizeInsertId(value: unknown) {
  const tripId = Number(value);
  if (!Number.isInteger(tripId) || tripId <= 0) throw new Error("Planner could not determine the created trip ID. Please try again.");
  return tripId;
}

export function buildVerifiedStops(parsed: ReturnType<typeof parseContent>, verifiedIds: Set<number>, tripId: number) {
  return parsed.days.flatMap(day => day.stops.filter(stop => verifiedIds.has(stop.destinationId)).map((stop, index) => ({ tripId, dayNumber: day.dayNumber, stopOrder: index + 1, destinationId: stop.destinationId, timeLabel: stop.timeLabel.slice(0, 40), rationale: stop.rationale.slice(0, 1000) })));
}

export const plannerRouter = router({
  verified: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Planner persistence is unavailable right now.");
    return db.select({ id: destinations.id, name: destinations.name, category: destinations.category, description: destinations.description, address: destinations.address }).from(destinations).where(eq(destinations.status, "active"));
  }),

  generate: protectedProcedure.input(plannerInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Planner persistence is unavailable right now.");

    const verified = await db.select({ id: destinations.id, name: destinations.name, category: destinations.category, description: destinations.description, address: destinations.address }).from(destinations).where(eq(destinations.status, "active"));
    if (verified.length === 0) throw new Error("No verified Laguna destinations are available yet.");

    const inserted = await db.insert(generatedTrips).values({
      ownerUserId: ctx.user.id,
      name: "Laguna Adventure",
      startDate: new Date(`${input.startDate}T00:00:00Z`),
      endDate: new Date(`${input.endDate}T00:00:00Z`),
      travelers: input.travelers,
      budgetLevel: input.budgetLevel,
      interests: JSON.stringify(input.interests),
      notes: input.notes,
      status: "generating",
    });
    const tripId = normalizeInsertId((inserted as { insertId?: number | bigint | string }).insertId);

    try {
      const response = await withTimeout(invokeLLM({
        messages: [
          { role: "system", content: "You are Kabiyahe's itinerary planner. Output JSON only. You may use only the verified Laguna destinations provided in the retrieval context. Never invent a destination, coordinate, business, price, or booking detail. Keep the route practical and avoid repeating a destination." },
          { role: "user", content: JSON.stringify({ task: "Build an editable day-by-day Laguna itinerary", trip: input, verifiedDestinations: verified }) },
        ],
        response_format: { type: "json_schema", json_schema: { name: "laguna_itinerary", strict: true, schema: { type: "object", properties: generatedShape, required: ["days"], additionalProperties: false } } },
      }), 25_000);
      const parsed = parseContent(response.choices[0]?.message?.content);
      const verifiedIds = new Set(verified.map(destination => destination.id));
      const safeStops = buildVerifiedStops(parsed, verifiedIds, tripId);
      if (safeStops.length === 0) throw new Error("The itinerary did not contain verified destinations.");
      await db.insert(generatedTripStops).values(safeStops);
      await db.update(generatedTrips).set({ status: "ready" }).where(and(eq(generatedTrips.id, tripId), eq(generatedTrips.ownerUserId, ctx.user.id)));
      return { tripId };
    } catch (error) {
      if (Number.isInteger(tripId) && tripId > 0) {
        try {
          await db.update(generatedTrips).set({ status: "failed" }).where(and(eq(generatedTrips.id, tripId), eq(generatedTrips.ownerUserId, ctx.user.id)));
        } catch {
          // Preserve the original generation error; never replace it with a cleanup failure.
        }
      }
      throw error;
    }
  }),

  get: protectedProcedure.input(z.object({ tripId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Planner persistence is unavailable right now.");
    const tripRows = await db.select().from(generatedTrips).where(and(eq(generatedTrips.id, input.tripId), eq(generatedTrips.ownerUserId, ctx.user.id))).limit(1);
    const trip = tripRows[0];
    if (!trip) throw new Error("Generated trip not found.");
    const stops = await db.select().from(generatedTripStops).where(eq(generatedTripStops.tripId, trip.id));
    const ids = stops.map(stop => stop.destinationId);
    const placeRows = ids.length ? await db.select().from(destinations).where(inArray(destinations.id, ids)) : [];
    const places = new Map(placeRows.map(place => [place.id, place]));
    return { trip, stops: stops.map(stop => ({ ...stop, destination: places.get(stop.destinationId) })) };
  }),

  removeStop: protectedProcedure.input(z.object({ tripId: z.number().int().positive(), stopId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Planner persistence is unavailable right now.");
    const trip = await db.select({ id: generatedTrips.id }).from(generatedTrips).where(and(eq(generatedTrips.id, input.tripId), eq(generatedTrips.ownerUserId, ctx.user.id))).limit(1);
    if (!trip[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Generated trip not found." });
    const stop = await db.select({ id: generatedTripStops.id }).from(generatedTripStops).where(and(eq(generatedTripStops.id, input.stopId), eq(generatedTripStops.tripId, input.tripId))).limit(1);
    if (!isStopOwned(stop.map(item => item.id), input.stopId)) throw new TRPCError({ code: "NOT_FOUND", message: "That itinerary stop could not be found." });
    await db.delete(generatedTripStops).where(and(eq(generatedTripStops.id, input.stopId), eq(generatedTripStops.tripId, input.tripId)));
    return { success: true as const };
  }),

  reorderStops: protectedProcedure.input(reorderStopsInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Planner persistence is unavailable right now.");
    const trip = await db.select({ id: generatedTrips.id }).from(generatedTrips).where(and(eq(generatedTrips.id, input.tripId), eq(generatedTrips.ownerUserId, ctx.user.id))).limit(1);
    if (!trip[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Generated trip not found." });
    const ids = input.stops.map(stop => stop.id);
    const ownedStops = await db.select({ id: generatedTripStops.id }).from(generatedTripStops).where(and(eq(generatedTripStops.tripId, input.tripId), inArray(generatedTripStops.id, ids)));
    if (hasForeignStopIds(ids, ownedStops.map(stop => stop.id))) throw new TRPCError({ code: "BAD_REQUEST", message: "The reorder included a stop outside this trip." });
    for (const stop of input.stops) {
      await db.update(generatedTripStops).set({ dayNumber: stop.dayNumber, stopOrder: stop.stopOrder }).where(and(eq(generatedTripStops.id, stop.id), eq(generatedTripStops.tripId, input.tripId)));
    }
    return { success: true as const };
  }),

  addStop: protectedProcedure.input(addStopInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Planner persistence is unavailable right now.");
    const trip = await db.select({ id: generatedTrips.id }).from(generatedTrips).where(and(eq(generatedTrips.id, input.tripId), eq(generatedTrips.ownerUserId, ctx.user.id))).limit(1);
    if (!trip[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Generated trip not found." });
    const destination = await db.select({ id: destinations.id }).from(destinations).where(and(eq(destinations.id, input.destinationId), eq(destinations.status, "active"))).limit(1);
    if (!destination[0]) throw new TRPCError({ code: "NOT_FOUND", message: "That destination is not in the verified Laguna catalog." });
    const existingDestination = await db.select({ destinationId: generatedTripStops.destinationId }).from(generatedTripStops).where(and(eq(generatedTripStops.tripId, input.tripId), eq(generatedTripStops.destinationId, input.destinationId))).limit(1);
    if (isDuplicateDestination(existingDestination.map(stop => stop.destinationId), input.destinationId)) throw new TRPCError({ code: "CONFLICT", message: "That verified destination is already in this itinerary." });
    const [last] = await db.select({ maxOrder: max(generatedTripStops.stopOrder) }).from(generatedTripStops).where(and(eq(generatedTripStops.tripId, input.tripId), eq(generatedTripStops.dayNumber, input.dayNumber)));
    const inserted = await db.insert(generatedTripStops).values({ tripId: input.tripId, dayNumber: input.dayNumber, stopOrder: Number(last?.maxOrder || 0) + 1, destinationId: input.destinationId, timeLabel: input.timeLabel, rationale: input.rationale });
    return { success: true as const, stopId: Number((inserted as { insertId?: number }).insertId) };
  }),
});
