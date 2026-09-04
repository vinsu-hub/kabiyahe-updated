import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import QRCode from "qrcode";
import { Plus, Trash2, Download, Loader2, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { adminCounts, deleteRow, listAdmin, replaceChildren, slugify, uploadMedia, upsertRow } from "@/lib/supabase/admin";
import { AdminShell } from "./AdminShell";
import type {
  AccommodationRow, DelicacyRow, DestinationRow, EventDetailRow, ParkingSpotRow, PassportLocationPublic, PassportReward,
  Season, TourOperator, TourPackageDetail,
} from "@/lib/supabase/types";

/* ------------------------------------------------------------------ helpers */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="admin-field"><span>{label}</span>{children}</label>;
}

function Drawer({ title, onClose, children, onSave, saving }: {
  title: string; onClose: () => void; children: React.ReactNode; onSave: () => void; saving: boolean;
}) {
  return (
    <div className="admin-drawer-backdrop" onClick={onClose}>
      <div className="admin-drawer" onClick={e => e.stopPropagation()}>
        <div className="admin-drawer-head"><h2>{title}</h2><button onClick={onClose} aria-label="Close"><X size={18} /></button></div>
        <div className="admin-drawer-body">{children}</div>
        <div className="admin-drawer-foot">
          <button className="btn secondary" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={onSave} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

function ImageField({ value, onChange, folder }: { value: string; onChange: (url: string) => void; folder: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="admin-image-field">
      {value && <img src={value} alt="" />}
      <input value={value} onChange={e => onChange(e.target.value)} placeholder="Image URL or upload →" />
      <label className="btn secondary">
        {busy ? "…" : "Upload"}
        <input type="file" accept="image/*" hidden disabled={busy} onChange={async e => {
          const f = e.target.files?.[0]; if (!f) return;
          setBusy(true);
          try { onChange(await uploadMedia(f, folder)); } catch (err) { alert((err as Error).message); }
          setBusy(false);
        }} />
      </label>
    </div>
  );
}

function RowsEditor<T extends Record<string, string>>({ rows, setRows, columns, blank }: {
  rows: T[]; setRows: (r: T[]) => void; columns: { key: keyof T; label: string; placeholder?: string }[]; blank: T;
}) {
  return (
    <div className="admin-rows">
      {rows.map((row, i) => (
        <div className="admin-row" key={i}>
          {columns.map(c => (
            <input key={String(c.key)} value={row[c.key]} placeholder={c.placeholder ?? c.label}
              onChange={e => setRows(rows.map((r, j) => j === i ? { ...r, [c.key]: e.target.value } : r))} />
          ))}
          <button className="admin-row-del" onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label="Remove"><Trash2 size={15} /></button>
        </div>
      ))}
      <button className="btn secondary sm" onClick={() => setRows([...rows, { ...blank }])}><Plus size={14} /> Add row</button>
    </div>
  );
}

const csvToArr = (s: string) => s.split(",").map(x => x.trim()).filter(Boolean);
const arrToCsv = (a: string[] | null | undefined) => (a ?? []).join(", ");

function useSeasonsList() {
  return useQuery({ queryKey: ["admin", "seasons"], queryFn: () => listAdmin<Season>("seasons", "*", "sort") });
}

/* ------------------------------------------------------------------ dashboard */

export function AdminDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ["admin", "counts"], queryFn: adminCounts });
  return (
    <AdminShell title="Dashboard">
      {isLoading ? <Loader2 className="elbiyahe-spin" /> : (
        <div className="admin-stat-grid">
          {[
            ["Events", data!.events, "/admin/events"],
            ["Tour packages", data!.tour_packages, "/admin/tours"],
            ["Passport spots", data!.passport_locations, "/admin/passport"],
            ["Rewards", data!.passport_rewards, "/admin/passport"],
            ["Delicacies", data!.delicacies, "/admin/delicacies"],
            ["Accommodations", data!.accommodations, "/admin/accommodations"],
            ["Parking spots", data!.parking_spots, "/admin/parking"],
            ["Destinations", data!.destinations, "/admin/destinations"],
            ["Tour reservations", data!.tour_reservations, null],
            ["Registered users", data!.profiles, null],
          ].map(([label, n, href]) => {
            const card = <div className="admin-stat"><b>{n as number}</b><span>{label as string}</span></div>;
            return href ? <Link key={label as string} href={href as string}>{card}</Link> : <div key={label as string}>{card}</div>;
          })}
        </div>
      )}
      <p className="admin-note">Content edited here is live immediately on the public site.</p>
    </AdminShell>
  );
}

/* ------------------------------------------------------------------ events */

const EMPTY_EVENT = {
  id: "", slug: "", title: "", category: "Community", season_key: "", status: "week",
  date_label: "", time_label: "", venue_name: "", barangay: "", lat: "", lng: "",
  attendee_count: "0", organizer: "", description: "", hero_image: "", featured: false,
};
type EventForm = typeof EMPTY_EVENT & { schedule: { time_label: string; item: string; state: string }[] };

export function AdminEvents() {
  const qc = useQueryClient();
  const seasons = useSeasonsList();
  const { data: rows, isLoading } = useQuery({
    queryKey: ["admin", "events"],
    queryFn: () => listAdmin<EventDetailRow>("events", "*, event_schedule_items(*)"),
  });
  const [form, setForm] = useState<EventForm | null>(null);
  const [saving, setSaving] = useState(false);

  const open = (row?: EventDetailRow) => setForm(row ? {
    ...EMPTY_EVENT, ...row,
    season_key: row.season_key ?? "", lat: String(row.lat ?? ""), lng: String(row.lng ?? ""),
    attendee_count: String(row.attendee_count ?? 0),
    date_label: row.date_label ?? "", time_label: row.time_label ?? "",
    venue_name: row.venue_name ?? "", barangay: row.barangay ?? "", organizer: row.organizer ?? "",
    description: row.description ?? "", hero_image: row.hero_image ?? "", featured: row.featured ?? false,
    schedule: [...(row.event_schedule_items ?? [])].sort((a, b) => a.sort - b.sort)
      .map(s => ({ time_label: s.time_label, item: s.item, state: s.state ?? "" })),
  } : { ...EMPTY_EVENT, schedule: [] });

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const { schedule, id, ...f } = form;
      const row = {
        ...(id ? { id } : {}),
        ...f,
        slug: f.slug || slugify(f.title),
        season_key: f.season_key || null,
        lat: f.lat ? Number(f.lat) : null,
        lng: f.lng ? Number(f.lng) : null,
        attendee_count: Number(f.attendee_count) || 0,
      };
      const saved = await upsertRow<any>("events", row);
      await replaceChildren("event_schedule_items", "event_id", saved.id,
        schedule.filter(s => s.item).map((s, i) => ({ time_label: s.time_label, item: s.item, state: s.state || null, sort: i + 1 })));
      qc.invalidateQueries({ queryKey: ["admin", "events"] });
      qc.invalidateQueries({ queryKey: ["events"] });
      setForm(null);
    } catch (e) { alert((e as Error).message); }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    await deleteRow("events", id);
    qc.invalidateQueries({ queryKey: ["admin", "events"] });
    qc.invalidateQueries({ queryKey: ["events"] });
  };

  return (
    <AdminShell title="Events" actions={<button className="btn primary" onClick={() => open()}><Plus size={15} /> New event</button>}>
      {isLoading ? <Loader2 className="elbiyahe-spin" /> : (
        <table className="admin-table">
          <thead><tr><th>Title</th><th>Category</th><th>Status</th><th>Date</th><th /></tr></thead>
          <tbody>
            {(rows ?? []).map(r => (
              <tr key={r.id}>
                <td><button className="admin-link" onClick={() => open(r)}>{r.title}</button></td>
                <td>{r.category}</td><td>{r.status}</td><td>{r.date_label}</td>
                <td><button className="admin-row-del" onClick={() => remove(r.id)}><Trash2 size={15} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {form && (
        <Drawer title={form.id ? "Edit event" : "New event"} onClose={() => setForm(null)} onSave={save} saving={saving}>
          <Field label="Title"><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="Slug (blank = auto)"><input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder={slugify(form.title)} /></Field>
          <div className="admin-grid2">
            <Field label="Category">
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {["Culture", "Sports", "Arts", "Community"].map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {["live", "today", "week", "season", "recap", "anytime"].map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Season">
            <select value={form.season_key} onChange={e => setForm({ ...form, season_key: e.target.value })}>
              <option value="">— none —</option>
              {(seasons.data ?? []).map(s => <option key={s.key} value={s.key}>{s.quarter} · {s.name}</option>)}
            </select>
          </Field>
          <div className="admin-grid2">
            <Field label="Date label"><input value={form.date_label} onChange={e => setForm({ ...form, date_label: e.target.value })} placeholder="Feb 15, 2026" /></Field>
            <Field label="Time label"><input value={form.time_label} onChange={e => setForm({ ...form, time_label: e.target.value })} placeholder="5:00 PM" /></Field>
          </div>
          <div className="admin-grid2">
            <Field label="Venue"><input value={form.venue_name} onChange={e => setForm({ ...form, venue_name: e.target.value })} /></Field>
            <Field label="Barangay"><input value={form.barangay} onChange={e => setForm({ ...form, barangay: e.target.value })} /></Field>
          </div>
          <div className="admin-grid2">
            <Field label="Lat"><input value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} /></Field>
            <Field label="Lng"><input value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })} /></Field>
          </div>
          <div className="admin-grid2">
            <Field label="Attendee count"><input value={form.attendee_count} onChange={e => setForm({ ...form, attendee_count: e.target.value })} /></Field>
            <Field label="Organizer"><input value={form.organizer} onChange={e => setForm({ ...form, organizer: e.target.value })} /></Field>
          </div>
          <Field label="Description"><textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field>
          <Field label="Hero image"><ImageField value={form.hero_image} onChange={url => setForm({ ...form, hero_image: url })} folder="events" /></Field>
          <label className="admin-checkbox">
            <input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} />
            Featured (shows in the Events page's Featured Event card)
          </label>
          <Field label="Schedule">
            <RowsEditor
              rows={form.schedule}
              setRows={schedule => setForm({ ...form, schedule })}
              blank={{ time_label: "", item: "", state: "" }}
              columns={[
                { key: "time_label", label: "Time", placeholder: "6:00 PM" },
                { key: "item", label: "Item", placeholder: "Opening Program" },
                { key: "state", label: "State", placeholder: "done|live|next" },
              ]}
            />
          </Field>
        </Drawer>
      )}
    </AdminShell>
  );
}

/* ------------------------------------------------------------------ tours */

const EMPTY_TOUR = {
  id: "", slug: "", operator_id: "", title: "", tags: "", duration: "", price_per_seat: "0",
  rating: "0", review_count: "0", featured: false, season_key: "", origin_pickup_points: "",
  departure_schedule: "", seat_capacity: "0", seats_available: "0", includes: "", summary: "",
  reserve_url: "", status: "active", hero_image: "",
};
type TourForm = typeof EMPTY_TOUR & { stops: { time_label: string; name: string; blurb: string }[] };

export function AdminTours() {
  const qc = useQueryClient();
  const seasons = useSeasonsList();
  const operators = useQuery({ queryKey: ["admin", "operators"], queryFn: () => listAdmin<TourOperator>("tour_operators", "*", "name") });
  const { data: rows, isLoading } = useQuery({
    queryKey: ["admin", "tours"],
    queryFn: () => listAdmin<TourPackageDetail>("tour_packages", "*, tour_operators(id,name), tour_itinerary_stops(*)"),
  });
  const [form, setForm] = useState<TourForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [newOperator, setNewOperator] = useState("");

  const open = (row?: TourPackageDetail) => setForm(row ? {
    ...EMPTY_TOUR, ...row,
    operator_id: row.operator_id, season_key: row.season_key ?? "",
    tags: arrToCsv(row.tags), origin_pickup_points: arrToCsv(row.origin_pickup_points), includes: arrToCsv(row.includes),
    price_per_seat: String(row.price_per_seat), rating: String(row.rating), review_count: String(row.review_count),
    seat_capacity: String(row.seat_capacity), seats_available: String(row.seats_available),
    duration: row.duration ?? "", departure_schedule: row.departure_schedule ?? "", summary: row.summary ?? "",
    reserve_url: row.reserve_url ?? "", hero_image: row.hero_image ?? "",
    stops: [...(row.tour_itinerary_stops ?? [])].sort((a, b) => a.sort - b.sort)
      .map(s => ({ time_label: s.time_label, name: s.name, blurb: s.blurb ?? "" })),
  } : { ...EMPTY_TOUR, stops: [] });

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      let operatorId = form.operator_id;
      if (newOperator.trim()) {
        const op = await upsertRow<any>("tour_operators", { name: newOperator.trim() }, "name");
        operatorId = op.id;
      }
      if (!operatorId) throw new Error("Pick or add an operator.");
      const { stops, id, tags, origin_pickup_points, includes, ...f } = form;
      const row = {
        ...(id ? { id } : {}),
        ...f,
        operator_id: operatorId,
        slug: f.slug || slugify(f.title),
        season_key: f.season_key || null,
        tags: csvToArr(tags), origin_pickup_points: csvToArr(origin_pickup_points), includes: csvToArr(includes),
        price_per_seat: Number(f.price_per_seat) || 0,
        rating: Number(f.rating) || 0,
        review_count: Number(f.review_count) || 0,
        seat_capacity: Number(f.seat_capacity) || 0,
        seats_available: Number(f.seats_available) || 0,
      };
      const saved = await upsertRow<any>("tour_packages", row);
      await replaceChildren("tour_itinerary_stops", "package_id", saved.id,
        stops.filter(s => s.name).map((s, i) => ({ time_label: s.time_label, name: s.name, blurb: s.blurb || null, sort: i + 1 })));
      qc.invalidateQueries({ queryKey: ["admin", "tours"] });
      qc.invalidateQueries({ queryKey: ["tours"] });
      setForm(null); setNewOperator("");
    } catch (e) { alert((e as Error).message); }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this tour package?")) return;
    await deleteRow("tour_packages", id);
    qc.invalidateQueries({ queryKey: ["admin", "tours"] });
    qc.invalidateQueries({ queryKey: ["tours"] });
  };

  return (
    <AdminShell title="Bus Tours" actions={<button className="btn primary" onClick={() => open()}><Plus size={15} /> New package</button>}>
      {isLoading ? <Loader2 className="elbiyahe-spin" /> : (
        <table className="admin-table">
          <thead><tr><th>Title</th><th>Operator</th><th>Price</th><th>Seats</th><th>Status</th><th /></tr></thead>
          <tbody>
            {(rows ?? []).map(r => (
              <tr key={r.id}>
                <td><button className="admin-link" onClick={() => open(r)}>{r.title}</button></td>
                <td>{r.tour_operators?.name}</td><td>₱{r.price_per_seat}</td>
                <td>{r.seats_available}/{r.seat_capacity}</td><td>{r.status}</td>
                <td><button className="admin-row-del" onClick={() => remove(r.id)}><Trash2 size={15} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {form && (
        <Drawer title={form.id ? "Edit package" : "New package"} onClose={() => { setForm(null); setNewOperator(""); }} onSave={save} saving={saving}>
          <Field label="Title"><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="Slug (blank = auto)"><input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder={slugify(form.title)} /></Field>
          <div className="admin-grid2">
            <Field label="Operator">
              <select value={form.operator_id} onChange={e => setForm({ ...form, operator_id: e.target.value })}>
                <option value="">— pick —</option>
                {(operators.data ?? []).map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </Field>
            <Field label="…or new operator"><input value={newOperator} onChange={e => setNewOperator(e.target.value)} placeholder="New operator name" /></Field>
          </div>
          <div className="admin-grid2">
            <Field label="Tags (comma-sep)"><input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="Nature, Culture" /></Field>
            <Field label="Duration"><input value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="1 Day" /></Field>
          </div>
          <div className="admin-grid2">
            <Field label="Season">
              <select value={form.season_key} onChange={e => setForm({ ...form, season_key: e.target.value })}>
                <option value="">— none —</option>
                {(seasons.data ?? []).map(s => <option key={s.key} value={s.key}>{s.quarter} · {s.name}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {["draft", "active", "archived"].map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <div className="admin-grid2">
            <Field label="Price / seat"><input value={form.price_per_seat} onChange={e => setForm({ ...form, price_per_seat: e.target.value })} /></Field>
            <Field label="Featured"><input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} /></Field>
          </div>
          <div className="admin-grid2">
            <Field label="Rating"><input value={form.rating} onChange={e => setForm({ ...form, rating: e.target.value })} /></Field>
            <Field label="Review count"><input value={form.review_count} onChange={e => setForm({ ...form, review_count: e.target.value })} /></Field>
          </div>
          <div className="admin-grid2">
            <Field label="Seat capacity"><input value={form.seat_capacity} onChange={e => setForm({ ...form, seat_capacity: e.target.value })} /></Field>
            <Field label="Seats available"><input value={form.seats_available} onChange={e => setForm({ ...form, seats_available: e.target.value })} /></Field>
          </div>
          <Field label="Pickup points (comma-sep)"><input value={form.origin_pickup_points} onChange={e => setForm({ ...form, origin_pickup_points: e.target.value })} /></Field>
          <Field label="Departure schedule"><input value={form.departure_schedule} onChange={e => setForm({ ...form, departure_schedule: e.target.value })} /></Field>
          <Field label="Includes (comma-sep)"><input value={form.includes} onChange={e => setForm({ ...form, includes: e.target.value })} /></Field>
          <Field label="Summary"><textarea rows={3} value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} /></Field>
          <Field label="Reserve URL (operator channel)"><input value={form.reserve_url} onChange={e => setForm({ ...form, reserve_url: e.target.value })} placeholder="https://…" /></Field>
          <Field label="Hero image"><ImageField value={form.hero_image} onChange={url => setForm({ ...form, hero_image: url })} folder="tours" /></Field>
          <Field label="Itinerary stops">
            <RowsEditor
              rows={form.stops}
              setRows={stops => setForm({ ...form, stops })}
              blank={{ time_label: "", name: "", blurb: "" }}
              columns={[
                { key: "time_label", label: "Time", placeholder: "8:00 AM" },
                { key: "name", label: "Stop", placeholder: "Makiling Botanic Gardens" },
                { key: "blurb", label: "Blurb" },
              ]}
            />
          </Field>
        </Drawer>
      )}
    </AdminShell>
  );
}

/* ------------------------------------------------------------------ passport */

function QrThumb({ code }: { code: string }) {
  const [url, setUrl] = useState("");
  useEffect(() => { QRCode.toDataURL(code, { width: 240, margin: 1 }).then(setUrl).catch(() => setUrl("")); }, [code]);
  if (!url) return null;
  return (
    <a href={url} download={`elbiyahe-qr-${code}.png`} className="admin-qr" title={`Download QR for ${code}`}>
      <img src={url} alt={`QR ${code}`} /><Download size={13} />
    </a>
  );
}

const EMPTY_LOC = { id: "", slug: "", name: "", category: "Nature", lat: "", lng: "", qr_code: "", active: true };
const EMPTY_REWARD = { id: "", title: "", description: "", tier: "", required_stamps: "0", active: true };

export function AdminPassport() {
  const qc = useQueryClient();
  const locations = useQuery({ queryKey: ["admin", "passport-locations"], queryFn: () => listAdmin<PassportLocationPublic & { qr_code: string }>("passport_locations", "*", "name") });
  const rewards = useQuery({ queryKey: ["admin", "passport-rewards"], queryFn: () => listAdmin<PassportReward>("passport_rewards", "*", "required_stamps") });
  const [locForm, setLocForm] = useState<typeof EMPTY_LOC | null>(null);
  const [rewForm, setRewForm] = useState<typeof EMPTY_REWARD | null>(null);
  const [saving, setSaving] = useState(false);

  const saveLoc = async () => {
    if (!locForm) return;
    setSaving(true);
    try {
      const { id, ...f } = locForm;
      await upsertRow("passport_locations", {
        ...(id ? { id } : {}), ...f, slug: f.slug || slugify(f.name),
        lat: f.lat ? Number(f.lat) : null, lng: f.lng ? Number(f.lng) : null,
        qr_code: f.qr_code || `ELBIYAHE-${slugify(f.name).toUpperCase().replace(/-/g, "")}`,
      });
      qc.invalidateQueries({ queryKey: ["admin", "passport-locations"] });
      qc.invalidateQueries({ queryKey: ["passport"] });
      setLocForm(null);
    } catch (e) { alert((e as Error).message); }
    setSaving(false);
  };

  const saveRew = async () => {
    if (!rewForm) return;
    setSaving(true);
    try {
      const { id, ...f } = rewForm;
      await upsertRow("passport_rewards", { ...(id ? { id } : {}), ...f, required_stamps: Number(f.required_stamps) || 0 });
      qc.invalidateQueries({ queryKey: ["admin", "passport-rewards"] });
      qc.invalidateQueries({ queryKey: ["passport"] });
      setRewForm(null);
    } catch (e) { alert((e as Error).message); }
    setSaving(false);
  };

  return (
    <AdminShell title="Passport">
      <section className="admin-section">
        <div className="admin-section-head"><h2>Passport spots</h2>
          <button className="btn primary" onClick={() => setLocForm({ ...EMPTY_LOC })}><Plus size={15} /> New spot</button></div>
        {locations.isLoading ? <Loader2 className="elbiyahe-spin" /> : (
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Category</th><th>QR code</th><th>QR</th><th>Active</th><th /></tr></thead>
            <tbody>
              {(locations.data ?? []).map(l => (
                <tr key={l.id}>
                  <td><button className="admin-link" onClick={() => setLocForm({
                    id: l.id, slug: l.slug, name: l.name, category: l.category, qr_code: l.qr_code,
                    lat: String(l.lat ?? ""), lng: String(l.lng ?? ""), active: l.active,
                  })}>{l.name}</button></td>
                  <td>{l.category}</td><td><code>{l.qr_code}</code></td><td><QrThumb code={l.qr_code} /></td>
                  <td>{l.active ? "yes" : "no"}</td>
                  <td><button className="admin-row-del" onClick={async () => { if (confirm("Delete spot?")) { await deleteRow("passport_locations", l.id); qc.invalidateQueries({ queryKey: ["admin", "passport-locations"] }); } }}><Trash2 size={15} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="admin-section">
        <div className="admin-section-head"><h2>Rewards</h2>
          <button className="btn primary" onClick={() => setRewForm({ ...EMPTY_REWARD })}><Plus size={15} /> New reward</button></div>
        {rewards.isLoading ? <Loader2 className="elbiyahe-spin" /> : (
          <table className="admin-table">
            <thead><tr><th>Title</th><th>Tier</th><th>Stamps</th><th>Active</th><th /></tr></thead>
            <tbody>
              {(rewards.data ?? []).map(r => (
                <tr key={r.id}>
                  <td><button className="admin-link" onClick={() => setRewForm({
                    id: r.id, title: r.title, description: r.description ?? "", tier: r.tier ?? "",
                    required_stamps: String(r.required_stamps), active: r.active,
                  })}>{r.title}</button></td>
                  <td>{r.tier}</td><td>{r.required_stamps}</td><td>{r.active ? "yes" : "no"}</td>
                  <td><button className="admin-row-del" onClick={async () => { if (confirm("Delete reward?")) { await deleteRow("passport_rewards", r.id); qc.invalidateQueries({ queryKey: ["admin", "passport-rewards"] }); } }}><Trash2 size={15} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {locForm && (
        <Drawer title={locForm.id ? "Edit spot" : "New spot"} onClose={() => setLocForm(null)} onSave={saveLoc} saving={saving}>
          <Field label="Name"><input value={locForm.name} onChange={e => setLocForm({ ...locForm, name: e.target.value })} /></Field>
          <Field label="Slug (blank = auto)"><input value={locForm.slug} onChange={e => setLocForm({ ...locForm, slug: e.target.value })} /></Field>
          <Field label="Category">
            <select value={locForm.category} onChange={e => setLocForm({ ...locForm, category: e.target.value })}>
              {["Nature", "Culture", "Food", "Science", "Event", "Community"].map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="QR code (blank = auto)"><input value={locForm.qr_code} onChange={e => setLocForm({ ...locForm, qr_code: e.target.value })} placeholder="ELBIYAHE-MAKILING" /></Field>
          <div className="admin-grid2">
            <Field label="Lat"><input value={locForm.lat} onChange={e => setLocForm({ ...locForm, lat: e.target.value })} /></Field>
            <Field label="Lng"><input value={locForm.lng} onChange={e => setLocForm({ ...locForm, lng: e.target.value })} /></Field>
          </div>
          <Field label="Active"><input type="checkbox" checked={locForm.active} onChange={e => setLocForm({ ...locForm, active: e.target.checked })} /></Field>
        </Drawer>
      )}

      {rewForm && (
        <Drawer title={rewForm.id ? "Edit reward" : "New reward"} onClose={() => setRewForm(null)} onSave={saveRew} saving={saving}>
          <Field label="Title"><input value={rewForm.title} onChange={e => setRewForm({ ...rewForm, title: e.target.value })} /></Field>
          <Field label="Description"><textarea rows={2} value={rewForm.description} onChange={e => setRewForm({ ...rewForm, description: e.target.value })} /></Field>
          <div className="admin-grid2">
            <Field label="Tier"><input value={rewForm.tier} onChange={e => setRewForm({ ...rewForm, tier: e.target.value })} placeholder="Explorer" /></Field>
            <Field label="Required stamps"><input value={rewForm.required_stamps} onChange={e => setRewForm({ ...rewForm, required_stamps: e.target.value })} /></Field>
          </div>
          <Field label="Active"><input type="checkbox" checked={rewForm.active} onChange={e => setRewForm({ ...rewForm, active: e.target.checked })} /></Field>
        </Drawer>
      )}
    </AdminShell>
  );
}

/* ------------------------------------------------------------------ delicacies */

const EMPTY_DELICACY = {
  id: "", slug: "", name: "", category: "Local Favorites", place: "", barangay: "", lat: "", lng: "",
  description: "", hero_image: "", price_tier: "1", rating: "", review_count: "0", tags: "",
  source_url: "", featured: false,
};
type DelicacyForm = typeof EMPTY_DELICACY;

export function AdminDelicacies() {
  const qc = useQueryClient();
  const { data: rows, isLoading } = useQuery({
    queryKey: ["admin", "delicacies"],
    queryFn: () => listAdmin<DelicacyRow>("delicacies", "*", "name"),
  });
  const [form, setForm] = useState<DelicacyForm | null>(null);
  const [saving, setSaving] = useState(false);

  const open = (row?: DelicacyRow) => setForm(row ? {
    ...EMPTY_DELICACY, ...row,
    place: row.place ?? "", barangay: row.barangay ?? "", lat: String(row.lat ?? ""), lng: String(row.lng ?? ""),
    description: row.description ?? "", hero_image: row.hero_image ?? "", price_tier: String(row.price_tier),
    rating: row.rating != null ? String(row.rating) : "", review_count: String(row.review_count),
    tags: arrToCsv(row.tags), source_url: row.source_url ?? "",
  } : { ...EMPTY_DELICACY });

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const { id, tags, ...f } = form;
      const row = {
        ...(id ? { id } : {}),
        ...f,
        slug: f.slug || slugify(f.name),
        place: f.place || null, barangay: f.barangay || null,
        lat: f.lat ? Number(f.lat) : null, lng: f.lng ? Number(f.lng) : null,
        description: f.description || null, hero_image: f.hero_image || null,
        price_tier: Number(f.price_tier) || 1,
        rating: f.rating ? Number(f.rating) : null,
        review_count: Number(f.review_count) || 0,
        tags: csvToArr(tags),
        source_url: f.source_url || null,
      };
      await upsertRow<any>("delicacies", row);
      qc.invalidateQueries({ queryKey: ["admin", "delicacies"] });
      qc.invalidateQueries({ queryKey: ["delicacies"] });
      setForm(null);
    } catch (e) { alert((e as Error).message); }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this delicacy?")) return;
    await deleteRow("delicacies", id);
    qc.invalidateQueries({ queryKey: ["admin", "delicacies"] });
    qc.invalidateQueries({ queryKey: ["delicacies"] });
  };

  return (
    <AdminShell title="Delicacies" actions={<button className="btn primary" onClick={() => open()}><Plus size={15} /> New delicacy</button>}>
      {isLoading ? <Loader2 className="elbiyahe-spin" /> : (
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Category</th><th>Place</th><th>Featured</th><th /></tr></thead>
          <tbody>
            {(rows ?? []).map(r => (
              <tr key={r.id}>
                <td><button className="admin-link" onClick={() => open(r)}>{r.name}</button></td>
                <td>{r.category}</td><td>{r.place}</td><td>{r.featured ? "Yes" : ""}</td>
                <td><button className="admin-row-del" onClick={() => remove(r.id)}><Trash2 size={15} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {form && (
        <Drawer title={form.id ? "Edit delicacy" : "New delicacy"} onClose={() => setForm(null)} onSave={save} saving={saving}>
          <Field label="Name"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Slug (blank = auto)"><input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder={slugify(form.name)} /></Field>
          <div className="admin-grid2">
            <Field label="Category">
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {["Local Favorites", "Street Food", "Baked Goods", "Dairy & Desserts", "Market Finds"].map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Price tier (1-4)"><input value={form.price_tier} onChange={e => setForm({ ...form, price_tier: e.target.value })} /></Field>
          </div>
          <div className="admin-grid2">
            <Field label="Place"><input value={form.place} onChange={e => setForm({ ...form, place: e.target.value })} /></Field>
            <Field label="Barangay"><input value={form.barangay} onChange={e => setForm({ ...form, barangay: e.target.value })} /></Field>
          </div>
          <div className="admin-grid2">
            <Field label="Lat"><input value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} /></Field>
            <Field label="Lng"><input value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })} /></Field>
          </div>
          <Field label="Description"><textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field>
          <Field label="Hero image"><ImageField value={form.hero_image} onChange={url => setForm({ ...form, hero_image: url })} folder="delicacies" /></Field>
          <div className="admin-grid2">
            <Field label="Rating"><input value={form.rating} onChange={e => setForm({ ...form, rating: e.target.value })} /></Field>
            <Field label="Review count"><input value={form.review_count} onChange={e => setForm({ ...form, review_count: e.target.value })} /></Field>
          </div>
          <Field label="Tags (comma-separated)"><input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} /></Field>
          <Field label="Source URL"><input value={form.source_url} onChange={e => setForm({ ...form, source_url: e.target.value })} /></Field>
          <Field label="Featured"><input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} /></Field>
        </Drawer>
      )}
    </AdminShell>
  );
}

/* ------------------------------------------------------------------ accommodations */

const EMPTY_STAY = {
  id: "", slug: "", name: "", category: "Hotel", place: "", barangay: "", lat: "", lng: "",
  price_range: "", amenities: "", description: "", hero_image: "", booking_referral_url: "",
  rating: "", review_count: "0", featured: false,
};
type StayForm = typeof EMPTY_STAY;

export function AdminAccommodations() {
  const qc = useQueryClient();
  const { data: rows, isLoading } = useQuery({
    queryKey: ["admin", "accommodations"],
    queryFn: () => listAdmin<AccommodationRow>("accommodations", "*", "name"),
  });
  const [form, setForm] = useState<StayForm | null>(null);
  const [saving, setSaving] = useState(false);

  const open = (row?: AccommodationRow) => setForm(row ? {
    ...EMPTY_STAY, ...row,
    place: row.place ?? "", barangay: row.barangay ?? "", lat: String(row.lat ?? ""), lng: String(row.lng ?? ""),
    price_range: row.price_range ?? "", amenities: arrToCsv(row.amenities),
    description: row.description ?? "", hero_image: row.hero_image ?? "",
    booking_referral_url: row.booking_referral_url ?? "",
    rating: row.rating != null ? String(row.rating) : "", review_count: String(row.review_count),
  } : { ...EMPTY_STAY });

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const { id, amenities, ...f } = form;
      const row = {
        ...(id ? { id } : {}),
        ...f,
        slug: f.slug || slugify(f.name),
        place: f.place || null, barangay: f.barangay || null,
        lat: f.lat ? Number(f.lat) : null, lng: f.lng ? Number(f.lng) : null,
        price_range: f.price_range || null, amenities: csvToArr(amenities),
        description: f.description || null, hero_image: f.hero_image || null,
        booking_referral_url: f.booking_referral_url || null,
        rating: f.rating ? Number(f.rating) : null,
        review_count: Number(f.review_count) || 0,
      };
      await upsertRow<any>("accommodations", row);
      qc.invalidateQueries({ queryKey: ["admin", "accommodations"] });
      qc.invalidateQueries({ queryKey: ["accommodations"] });
      setForm(null);
    } catch (e) { alert((e as Error).message); }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this stay?")) return;
    await deleteRow("accommodations", id);
    qc.invalidateQueries({ queryKey: ["admin", "accommodations"] });
    qc.invalidateQueries({ queryKey: ["accommodations"] });
  };

  return (
    <AdminShell title="Accommodations" actions={<button className="btn primary" onClick={() => open()}><Plus size={15} /> New stay</button>}>
      {isLoading ? <Loader2 className="elbiyahe-spin" /> : (
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Category</th><th>Place</th><th>Featured</th><th /></tr></thead>
          <tbody>
            {(rows ?? []).map(r => (
              <tr key={r.id}>
                <td><button className="admin-link" onClick={() => open(r)}>{r.name}</button></td>
                <td>{r.category}</td><td>{r.place}</td><td>{r.featured ? "Yes" : ""}</td>
                <td><button className="admin-row-del" onClick={() => remove(r.id)}><Trash2 size={15} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {form && (
        <Drawer title={form.id ? "Edit stay" : "New stay"} onClose={() => setForm(null)} onSave={save} saving={saving}>
          <Field label="Name"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Slug (blank = auto)"><input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder={slugify(form.name)} /></Field>
          <div className="admin-grid2">
            <Field label="Category">
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {["Hotel", "Resort", "Homestay"].map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Price range"><input value={form.price_range} onChange={e => setForm({ ...form, price_range: e.target.value })} placeholder="₱2,500-4,000/night" /></Field>
          </div>
          <div className="admin-grid2">
            <Field label="Place"><input value={form.place} onChange={e => setForm({ ...form, place: e.target.value })} /></Field>
            <Field label="Barangay"><input value={form.barangay} onChange={e => setForm({ ...form, barangay: e.target.value })} /></Field>
          </div>
          <div className="admin-grid2">
            <Field label="Lat"><input value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} /></Field>
            <Field label="Lng"><input value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })} /></Field>
          </div>
          <Field label="Description"><textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field>
          <Field label="Hero image"><ImageField value={form.hero_image} onChange={url => setForm({ ...form, hero_image: url })} folder="accommodations" /></Field>
          <Field label="Amenities (comma-separated)"><input value={form.amenities} onChange={e => setForm({ ...form, amenities: e.target.value })} /></Field>
          <Field label="Booking referral URL"><input value={form.booking_referral_url} onChange={e => setForm({ ...form, booking_referral_url: e.target.value })} /></Field>
          <div className="admin-grid2">
            <Field label="Rating"><input value={form.rating} onChange={e => setForm({ ...form, rating: e.target.value })} /></Field>
            <Field label="Review count"><input value={form.review_count} onChange={e => setForm({ ...form, review_count: e.target.value })} /></Field>
          </div>
          <Field label="Featured"><input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} /></Field>
        </Drawer>
      )}
    </AdminShell>
  );
}

/* ------------------------------------------------------------------ parking */

const EMPTY_PARKING = {
  id: "", slug: "", name: "", place: "", barangay: "", lat: "", lng: "", kind: "free",
  fee_label: "", capacity_estimate: "", hours_label: "", notes: "", hero_image: "",
};
type ParkingForm = typeof EMPTY_PARKING;

export function AdminParkingSpots() {
  const qc = useQueryClient();
  const { data: rows, isLoading } = useQuery({
    queryKey: ["admin", "parking-spots"],
    queryFn: () => listAdmin<ParkingSpotRow>("parking_spots", "*", "name"),
  });
  const [form, setForm] = useState<ParkingForm | null>(null);
  const [saving, setSaving] = useState(false);

  const open = (row?: ParkingSpotRow) => setForm(row ? {
    ...EMPTY_PARKING, ...row,
    place: row.place ?? "", barangay: row.barangay ?? "", lat: String(row.lat ?? ""), lng: String(row.lng ?? ""),
    fee_label: row.fee_label ?? "", capacity_estimate: row.capacity_estimate ?? "",
    hours_label: row.hours_label ?? "", notes: row.notes ?? "", hero_image: row.hero_image ?? "",
  } : { ...EMPTY_PARKING });

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const { id, ...f } = form;
      const row = {
        ...(id ? { id } : {}),
        ...f,
        slug: f.slug || slugify(f.name),
        place: f.place || null, barangay: f.barangay || null,
        lat: f.lat ? Number(f.lat) : null, lng: f.lng ? Number(f.lng) : null,
        fee_label: f.fee_label || null, capacity_estimate: f.capacity_estimate || null,
        hours_label: f.hours_label || null, notes: f.notes || null, hero_image: f.hero_image || null,
      };
      await upsertRow<any>("parking_spots", row);
      qc.invalidateQueries({ queryKey: ["admin", "parking-spots"] });
      qc.invalidateQueries({ queryKey: ["parking-spots"] });
      setForm(null);
    } catch (e) { alert((e as Error).message); }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this parking spot?")) return;
    await deleteRow("parking_spots", id);
    qc.invalidateQueries({ queryKey: ["admin", "parking-spots"] });
    qc.invalidateQueries({ queryKey: ["parking-spots"] });
  };

  return (
    <AdminShell title="Parking" actions={<button className="btn primary" onClick={() => open()}><Plus size={15} /> New spot</button>}>
      {isLoading ? <Loader2 className="elbiyahe-spin" /> : (
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Kind</th><th>Place</th><th /></tr></thead>
          <tbody>
            {(rows ?? []).map(r => (
              <tr key={r.id}>
                <td><button className="admin-link" onClick={() => open(r)}>{r.name}</button></td>
                <td>{r.kind}</td><td>{r.place}</td>
                <td><button className="admin-row-del" onClick={() => remove(r.id)}><Trash2 size={15} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {form && (
        <Drawer title={form.id ? "Edit spot" : "New spot"} onClose={() => setForm(null)} onSave={save} saving={saving}>
          <Field label="Name"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Slug (blank = auto)"><input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder={slugify(form.name)} /></Field>
          <div className="admin-grid2">
            <Field label="Kind">
              <select value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value })}>
                <option value="free">Free</option><option value="paid">Paid</option>
              </select>
            </Field>
            <Field label="Fee label"><input value={form.fee_label} onChange={e => setForm({ ...form, fee_label: e.target.value })} placeholder="₱20/hour" /></Field>
          </div>
          <div className="admin-grid2">
            <Field label="Place"><input value={form.place} onChange={e => setForm({ ...form, place: e.target.value })} /></Field>
            <Field label="Barangay"><input value={form.barangay} onChange={e => setForm({ ...form, barangay: e.target.value })} /></Field>
          </div>
          <div className="admin-grid2">
            <Field label="Lat"><input value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} /></Field>
            <Field label="Lng"><input value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })} /></Field>
          </div>
          <div className="admin-grid2">
            <Field label="Capacity estimate"><input value={form.capacity_estimate} onChange={e => setForm({ ...form, capacity_estimate: e.target.value })} placeholder="~40 slots" /></Field>
            <Field label="Hours"><input value={form.hours_label} onChange={e => setForm({ ...form, hours_label: e.target.value })} placeholder="6 AM - 10 PM" /></Field>
          </div>
          <Field label="Notes"><textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></Field>
          <Field label="Hero image"><ImageField value={form.hero_image} onChange={url => setForm({ ...form, hero_image: url })} folder="parking" /></Field>
        </Drawer>
      )}
    </AdminShell>
  );
}

/* ------------------------------------------------------------------ destinations */

const EMPTY_DESTINATION = {
  id: "", slug: "", name: "", place: "", type: "Nature", icon_key: "Compass", description: "",
  hero_image: "", gallery: "", rating: "", review_count: "", tags: "", price_tier: "1",
  placeholder: false, verified: false, featured: false,
};
type DestinationForm = typeof EMPTY_DESTINATION;

export function AdminDestinations() {
  const qc = useQueryClient();
  const { data: rows, isLoading } = useQuery({
    queryKey: ["admin", "destinations"],
    queryFn: () => listAdmin<DestinationRow>("destinations", "*", "name"),
  });
  const [form, setForm] = useState<DestinationForm | null>(null);
  const [saving, setSaving] = useState(false);

  const open = (row?: DestinationRow) => setForm(row ? {
    ...EMPTY_DESTINATION, ...row,
    place: row.place ?? "", description: row.description ?? "", hero_image: row.hero_image ?? "",
    gallery: arrToCsv(row.gallery), rating: row.rating != null ? String(row.rating) : "",
    review_count: row.review_count != null ? String(row.review_count) : "", tags: arrToCsv(row.tags),
    price_tier: String(row.price_tier),
  } : { ...EMPTY_DESTINATION });

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const { id, gallery, tags, ...f } = form;
      const row = {
        ...(id ? { id } : {}),
        ...f,
        slug: f.slug || slugify(f.name),
        place: f.place || null, description: f.description || null, hero_image: f.hero_image || null,
        gallery: csvToArr(gallery), tags: csvToArr(tags),
        rating: f.rating ? Number(f.rating) : null,
        review_count: f.review_count ? Number(f.review_count) : null,
        price_tier: Number(f.price_tier) || 1,
      };
      await upsertRow<any>("destinations", row);
      qc.invalidateQueries({ queryKey: ["admin", "destinations"] });
      qc.invalidateQueries({ queryKey: ["destinations"] });
      setForm(null);
    } catch (e) { alert((e as Error).message); }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this destination?")) return;
    await deleteRow("destinations", id);
    qc.invalidateQueries({ queryKey: ["admin", "destinations"] });
    qc.invalidateQueries({ queryKey: ["destinations"] });
  };

  return (
    <AdminShell title="Destinations" actions={<button className="btn primary" onClick={() => open()}><Plus size={15} /> New destination</button>}>
      {isLoading ? <Loader2 className="elbiyahe-spin" /> : (
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Type</th><th>Place</th><th>Featured</th><th /></tr></thead>
          <tbody>
            {(rows ?? []).map(r => (
              <tr key={r.id}>
                <td><button className="admin-link" onClick={() => open(r)}>{r.name}</button></td>
                <td>{r.type}</td><td>{r.place}</td><td>{r.featured ? "Yes" : ""}</td>
                <td><button className="admin-row-del" onClick={() => remove(r.id)}><Trash2 size={15} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {form && (
        <Drawer title={form.id ? "Edit destination" : "New destination"} onClose={() => setForm(null)} onSave={save} saving={saving}>
          <Field label="Name"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Slug (blank = auto)"><input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder={slugify(form.name)} /></Field>
          <div className="admin-grid2">
            <Field label="Type">
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {["Nature", "Culture", "Relaxation", "Attractions", "Food", "Hotels"].map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Icon">
              <select value={form.icon_key} onChange={e => setForm({ ...form, icon_key: e.target.value })}>
                {["Mountain", "Landmark", "Sparkles", "Compass", "Utensils", "WalletCards"].map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Place"><input value={form.place} onChange={e => setForm({ ...form, place: e.target.value })} /></Field>
          <Field label="Description"><textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field>
          <Field label="Hero image"><ImageField value={form.hero_image} onChange={url => setForm({ ...form, hero_image: url })} folder="destinations" /></Field>
          <Field label="Gallery URLs (comma-separated)"><input value={form.gallery} onChange={e => setForm({ ...form, gallery: e.target.value })} /></Field>
          <div className="admin-grid2">
            <Field label="Rating"><input value={form.rating} onChange={e => setForm({ ...form, rating: e.target.value })} /></Field>
            <Field label="Review count"><input value={form.review_count} onChange={e => setForm({ ...form, review_count: e.target.value })} /></Field>
          </div>
          <Field label="Tags (comma-separated)"><input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} /></Field>
          <Field label="Price tier (1-4)"><input value={form.price_tier} onChange={e => setForm({ ...form, price_tier: e.target.value })} /></Field>
          <div className="admin-grid2">
            <Field label="Placeholder listing"><input type="checkbox" checked={form.placeholder} onChange={e => setForm({ ...form, placeholder: e.target.checked })} /></Field>
            <Field label="Research-backed / verified"><input type="checkbox" checked={form.verified} onChange={e => setForm({ ...form, verified: e.target.checked })} /></Field>
          </div>
          <Field label="Featured on Home"><input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} /></Field>
        </Drawer>
      )}
    </AdminShell>
  );
}
