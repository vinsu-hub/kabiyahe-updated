import { double, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/** Core user table backing Manus auth and role-aware portal access. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "partner", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const destinations = mysqlTable("destinations", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  name: varchar("name", { length: 180 }).notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  description: text("description"),
  address: text("address"),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  claimedByPartnerId: int("claimedByPartnerId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Destination = typeof destinations.$inferSelect;
export type InsertDestination = typeof destinations.$inferInsert;

export const partners = mysqlTable("partners", {
  id: int("id").autoincrement().primaryKey(),
  ownerUserId: int("ownerUserId"),
  businessName: varchar("businessName", { length: 180 }).notNull(),
  partnerType: mysqlEnum("partnerType", ["spot", "restaurant", "hotel", "guide"]).notNull(),
  listingSubtype: mysqlEnum("listingSubtype", ["hotel_resort", "airbnb_host", "restaurant"]),
  acceptReservations: int("acceptReservations").default(0).notNull(),
  categories: text("categories"),
  contactName: varchar("contactName", { length: 160 }).notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 40 }),
  businessAddress: text("businessAddress"),
  latitude: double("latitude"),
  longitude: double("longitude"),
  bookingUrl: varchar("bookingUrl", { length: 500 }),
  description: text("description"),
  businessPermitNumber: varchar("businessPermitNumber", { length: 120 }),
  status: mysqlEnum("status", ["pending", "active", "rejected", "info_requested", "suspended", "deactivated"]).default("pending").notNull(),
  linkedDestinationId: int("linkedDestinationId"),
  visibilityTier: mysqlEnum("visibilityTier", ["standard", "featured"]).default("standard").notNull(),
  rejectionReason: text("rejectionReason"),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Partner = typeof partners.$inferSelect;
export type InsertPartner = typeof partners.$inferInsert;

export const inventoryUnits = mysqlTable("inventoryUnits", {
  id: int("id").autoincrement().primaryKey(),
  partnerId: int("partnerId").notNull(),
  type: mysqlEnum("type", ["room_type", "vacation_unit", "table_category", "menu_highlight"]).notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  capacity: int("capacity").default(1).notNull(),
  quantityAvailable: int("quantityAvailable").default(1).notNull(),
  baseRateRange: varchar("baseRateRange", { length: 120 }),
  photos: text("photos"),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type InventoryUnit = typeof inventoryUnits.$inferSelect;
export type InsertInventoryUnit = typeof inventoryUnits.$inferInsert;

export const availabilityBlocks = mysqlTable("availabilityBlocks", {
  id: int("id").autoincrement().primaryKey(),
  partnerId: int("partnerId").notNull(),
  inventoryUnitId: int("inventoryUnitId"),
  dateStart: timestamp("dateStart").notNull(),
  dateEnd: timestamp("dateEnd").notNull(),
  reason: varchar("reason", { length: 500 }),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AvailabilityBlock = typeof availabilityBlocks.$inferSelect;
export type InsertAvailabilityBlock = typeof availabilityBlocks.$inferInsert;

export const reservations = mysqlTable("reservations", {
  id: int("id").autoincrement().primaryKey(),
  partnerId: int("partnerId").notNull(),
  destinationId: int("destinationId"),
  inventoryUnitId: int("inventoryUnitId"),
  guestName: varchar("guestName", { length: 180 }).notNull(),
  guestContact: varchar("guestContact", { length: 320 }).notNull(),
  partySize: int("partySize").default(1).notNull(),
  roomOrTableRef: varchar("roomOrTableRef", { length: 180 }),
  dateStart: timestamp("dateStart").notNull(),
  dateEnd: timestamp("dateEnd"),
  timeSlot: varchar("timeSlot", { length: 80 }),
  status: mysqlEnum("status", ["requested", "confirmed", "completed", "cancelled", "no_show"]).default("requested").notNull(),
  source: mysqlEnum("source", ["kabiyahe_direct", "itinerary_linked"]).default("kabiyahe_direct").notNull(),
  notes: text("notes"),
  cancelledReason: varchar("cancelledReason", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Reservation = typeof reservations.$inferSelect;
export type InsertReservation = typeof reservations.$inferInsert;

export const partnerNotifications = mysqlTable("partnerNotifications", {
  id: int("id").autoincrement().primaryKey(),
  partnerId: int("partnerId").notNull(),
  type: mysqlEnum("type", ["new_reservation", "cancellation", "review_flag", "admin_message"]).notNull(),
  reservationId: int("reservationId"),
  message: varchar("message", { length: 500 }).notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PartnerNotification = typeof partnerNotifications.$inferSelect;
export type InsertPartnerNotification = typeof partnerNotifications.$inferInsert;

export const partnerStaff = mysqlTable("partnerStaff", {
  id: int("id").autoincrement().primaryKey(),
  partnerId: int("partnerId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["owner", "staff"]).default("staff").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PartnerStaff = typeof partnerStaff.$inferSelect;
export type InsertPartnerStaff = typeof partnerStaff.$inferInsert;

export const partnerPhotos = mysqlTable("partnerPhotos", {
  id: int("id").autoincrement().primaryKey(),
  partnerId: int("partnerId").notNull(),
  storageKey: varchar("storageKey", { length: 500 }).notNull(),
  url: varchar("url", { length: 800 }).notNull(),
  mimeType: varchar("mimeType", { length: 80 }),
  fileName: varchar("fileName", { length: 240 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const partnerMetrics = mysqlTable("partnerMetrics", {
  id: int("id").autoincrement().primaryKey(),
  partnerId: int("partnerId").notNull(),
  metricDate: timestamp("metricDate").notNull(),
  clickThroughCount: int("clickThroughCount").default(0).notNull(),
  itineraryInclusionCount: int("itineraryInclusionCount").default(0).notNull(),
  walletSaveCount: int("walletSaveCount").default(0).notNull(),
});

export const partnerAdminLog = mysqlTable("partnerAdminLog", {
  id: int("id").autoincrement().primaryKey(),
  partnerId: int("partnerId").notNull(),
  adminUserId: int("adminUserId").notNull(),
  action: mysqlEnum("action", ["approved", "rejected", "suspended", "info_requested", "deactivated", "claimed"]).notNull(),
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});


export const generatedTrips = mysqlTable("generatedTrips", {
  id: int("id").autoincrement().primaryKey(),
  ownerUserId: int("ownerUserId").notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  travelers: int("travelers").notNull(),
  budgetLevel: int("budgetLevel").notNull(),
  interests: text("interests").notNull(),
  notes: text("notes"),
  status: mysqlEnum("status", ["draft", "generating", "ready", "failed"]).default("generating").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type GeneratedTrip = typeof generatedTrips.$inferSelect;
export type InsertGeneratedTrip = typeof generatedTrips.$inferInsert;

export const generatedTripStops = mysqlTable("generatedTripStops", {
  id: int("id").autoincrement().primaryKey(),
  tripId: int("tripId").notNull(),
  dayNumber: int("dayNumber").notNull(),
  stopOrder: int("stopOrder").notNull(),
  destinationId: int("destinationId").notNull(),
  timeLabel: varchar("timeLabel", { length: 40 }).notNull(),
  rationale: text("rationale"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type GeneratedTripStop = typeof generatedTripStops.$inferSelect;
export type InsertGeneratedTripStop = typeof generatedTripStops.$inferInsert;

export const walletTicketAttachments = mysqlTable("walletTicketAttachments", {
  id: int("id").autoincrement().primaryKey(),
  ownerUserId: int("ownerUserId").notNull(),
  tripId: varchar("tripId", { length: 180 }).notNull(),
  entryName: varchar("entryName", { length: 180 }).notNull(),
  storageKey: varchar("storageKey", { length: 500 }).notNull(),
  url: varchar("url", { length: 800 }).notNull(),
  mimeType: varchar("mimeType", { length: 80 }).notNull(),
  fileName: varchar("fileName", { length: 240 }).notNull(),
  fileSize: int("fileSize").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type WalletTicketAttachment = typeof walletTicketAttachments.$inferSelect;
export type InsertWalletTicketAttachment = typeof walletTicketAttachments.$inferInsert;


export const feedPosts = mysqlTable("feedPosts", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["popup", "live_event", "promo", "cultural", "alert"]).notNull(),
  title: varchar("title", { length: 220 }).notNull(),
  description: text("description").notNull(),
  coverPhoto: varchar("coverPhoto", { length: 800 }),
  destinationId: int("destinationId"),
  partnerId: int("partnerId"),
  startsAt: timestamp("startsAt").notNull(),
  endsAt: timestamp("endsAt"),
  outboundLink: varchar("outboundLink", { length: 800 }),
  source: mysqlEnum("source", ["admin", "partner", "tourism_council"]).default("admin").notNull(),
  status: mysqlEnum("status", ["pending_review", "live", "archived", "rejected"]).default("pending_review").notNull(),
  boosted: int("boosted").default(0).notNull(),
  boostedUntil: timestamp("boostedUntil"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type FeedPost = typeof feedPosts.$inferSelect;
export type InsertFeedPost = typeof feedPosts.$inferInsert;

export const feedPostNotifications = mysqlTable("feedPostNotifications", {
  id: int("id").autoincrement().primaryKey(),
  feedPostId: int("feedPostId").notNull(),
  userId: int("userId").notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type FeedPostNotification = typeof feedPostNotifications.$inferSelect;
export type InsertFeedPostNotification = typeof feedPostNotifications.$inferInsert;
