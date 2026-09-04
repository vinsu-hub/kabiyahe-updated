/* Admin-only Supabase helpers. Every write here is gated by RLS (is_admin()). */
import { supabase } from "./client";

export async function uploadMedia(file: File, folder: string): Promise<string> {
  const ext = file.name.split(".").pop() || "bin";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { upsert: false });
  if (error) throw new Error(error.message);
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}

export const slugify = (v: string) =>
  v.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export async function adminCounts() {
  const tables = ["events", "tour_packages", "passport_locations", "passport_rewards", "tour_reservations", "profiles", "delicacies"] as const;
  const entries = await Promise.all(
    tables.map(async t => {
      const { count } = await supabase.from(t).select("*", { count: "exact", head: true });
      return [t, count ?? 0] as const;
    }),
  );
  return Object.fromEntries(entries) as Record<(typeof tables)[number], number>;
}

export async function listAdmin<T>(table: string, select = "*", order = "created_at"): Promise<T[]> {
  const { data, error } = await supabase.from(table).select(select).order(order, { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as T[];
}

export async function upsertRow<T extends Record<string, unknown>>(table: string, row: T, conflict = "id"): Promise<T> {
  const { data, error } = await supabase.from(table).upsert(row, { onConflict: conflict }).select().single();
  if (error) throw new Error(error.message);
  return data as T;
}

export async function deleteRow(table: string, id: string) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function replaceChildren(table: string, fk: string, fkValue: string, rows: Record<string, unknown>[]) {
  const del = await supabase.from(table).delete().eq(fk, fkValue);
  if (del.error) throw new Error(del.error.message);
  if (rows.length) {
    const ins = await supabase.from(table).insert(rows.map(r => ({ ...r, [fk]: fkValue })));
    if (ins.error) throw new Error(ins.error.message);
  }
}
