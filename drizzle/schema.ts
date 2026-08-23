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