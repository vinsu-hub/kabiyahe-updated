import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

const RETRYABLE_DB_CODES = new Set(["ETIMEDOUT", "ECONNRESET", "PROTOCOL_CONNECTION_LOST", "EPIPE"]);

export function isTransientDbError(error: unknown) {
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as { code?: unknown; cause?: { code?: unknown } };
  const code = String(candidate.code ?? candidate.cause?.code ?? "");
  return RETRYABLE_DB_CODES.has(code) || /ETIMEDOUT|ECONNRESET|PROTOCOL_CONNECTION_LOST|EPIPE/.test(String(error));
}

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
      return;
    } catch (error) {
      if (!isTransientDbError(error) || attempt === 3) {
        console.error("[Database] Failed to upsert user:", error);
        throw error;
      }
      console.warn(`[Database] Transient upsert failure; retrying (${attempt}/2).`);
      await wait(attempt * 250);
    }
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.
