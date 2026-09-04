/* React-Query hooks over Supabase for the El-Biyahe! feature tabs. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./client";
import { useAuth } from "./AuthProvider";
import type {
  DelicacyRow, EventDetailRow, EventRow, PassportLocationPublic, PassportReward, RideRoute, RideTip,
  ScanResult, Season, TourPackageDetail, TourPackageRow,
} from "./types";

const throwIf = <T>({ data, error }: { data: T; error: { message: string } | null }): T => {
  if (error) throw new Error(error.message);
  return data;
};

/* ---------------------------------------------------------------- seasons */
export function useSeasons() {
  return useQuery({
    queryKey: ["seasons"],
    queryFn: async () =>
      throwIf(await supabase.from("seasons").select("*").order("sort")) as Season[],
    staleTime: 5 * 60_000,
  });
}
export function useCurrentSeason() {
  const q = useSeasons();
  return { ...q, data: q.data?.find(s => s.is_current) ?? q.data?.[0] };
}

/* ---------------------------------------------------------------- events */
export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: async () =>
      throwIf(
        await supabase.from("events").select("*").order("starts_at", { ascending: true, nullsFirst: false }),
      ) as EventRow[],
  });
}

export function useEvent(slug: string | undefined) {
  return useQuery({
    enabled: Boolean(slug),
    queryKey: ["event", slug],
    queryFn: async () =>
      throwIf(
        await supabase
          .from("events")
          .select("*, event_schedule_items(*), event_updates(*)")
          .eq("slug", slug!)
          .maybeSingle(),
      ) as EventDetailRow | null,
  });
}

export function useMyRsvp(eventId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    enabled: Boolean(eventId && user),
    queryKey: ["rsvp", eventId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("id")
        .eq("event_id", eventId!)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return Boolean(data);
    },
  });
}

export function useToggleRsvp(eventId: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (going: boolean) => {
      if (!user) throw new Error("auth");
      if (going) {
        const { error } = await supabase.from("event_rsvps").insert({ event_id: eventId, user_id: user.id });
        if (error && error.code !== "23505") throw new Error(error.message);
      } else {
        const { error } = await supabase.from("event_rsvps").delete().eq("event_id", eventId).eq("user_id", user.id);
        if (error) throw new Error(error.message);
      }
      return going;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rsvp", eventId] }),
  });
}

/* ---------------------------------------------------------------- tours */
export interface TourListItem extends TourPackageRow {
  operator_name: string | null;
}

export function useTours() {
  return useQuery({
    queryKey: ["tours"],
    queryFn: async () => {
      const rows = throwIf(
        await supabase
          .from("tour_packages")
          .select("*, tour_operators(name)")
          .eq("status", "active")
          .order("featured", { ascending: false }),
      ) as (TourPackageRow & { tour_operators: { name: string } | null })[];
      return rows.map(({ tour_operators, ...r }) => ({ ...r, operator_name: tour_operators?.name ?? null })) as TourListItem[];
    },
  });
}

export function useTour(slug: string | undefined) {
  return useQuery({
    enabled: Boolean(slug),
    queryKey: ["tour", slug],
    queryFn: async () =>
      throwIf(
        await supabase
          .from("tour_packages")
          .select("*, tour_operators(id,name), tour_itinerary_stops(*), tour_reviews(*)")
          .eq("slug", slug!)
          .maybeSingle(),
      ) as TourPackageDetail | null,
  });
}

export function useReserveTour() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (pkg: { id: string; reserve_url: string | null; title: string; operator_name?: string | null }) => {
      if (!user) throw new Error("auth");
      const { error: rErr } = await supabase
        .from("tour_reservations")
        .insert({ package_id: pkg.id, user_id: user.id, seats: 1 });
      if (rErr) throw new Error(rErr.message);
      // Referral-only: log the hand-off, never process payment.
      await supabase.from("referral_events").insert({
        type: "tour_reservation",
        entity_id: pkg.id,
        user_id: user.id,
        meta: { title: pkg.title, operator: pkg.operator_name ?? null },
      });
      if (pkg.reserve_url) window.open(pkg.reserve_url, "_blank", "noopener");
      return true;
    },
  });
}

/* ---------------------------------------------------------------- passport */
export interface PassportState {
  locations: PassportLocationPublic[];
  scannedLocationIds: string[];
  rewards: PassportReward[];
  xp: number;
  explorerLevel: number;
}

export function usePassport() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["passport", user?.id ?? "guest"],
    queryFn: async (): Promise<PassportState> => {
      const [locations, rewards] = await Promise.all([
        supabase.from("passport_locations_public").select("*").order("name"),
        supabase.from("passport_rewards").select("*").eq("active", true).order("required_stamps"),
      ]);
      if (locations.error) throw new Error(locations.error.message);
      if (rewards.error) throw new Error(rewards.error.message);

      let scannedLocationIds: string[] = [];
      let xp = 0;
      let explorerLevel = 1;
      if (user) {
        const [scans, profile] = await Promise.all([
          supabase.from("passport_scans").select("location_id").eq("user_id", user.id),
          supabase.from("profiles").select("xp, explorer_level").eq("id", user.id).maybeSingle(),
        ]);
        scannedLocationIds = (scans.data ?? []).map(s => s.location_id as string);
        xp = profile.data?.xp ?? 0;
        explorerLevel = profile.data?.explorer_level ?? 1;
      }
      return {
        locations: locations.data as PassportLocationPublic[],
        scannedLocationIds,
        rewards: rewards.data as PassportReward[],
        xp,
        explorerLevel,
      };
    },
  });
}

export function useScanPassport() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { code: string; lat?: number; lng?: number }): Promise<ScanResult> => {
      if (!user) return { ok: false, reason: "auth", message: "Sign in to collect stamps." };
      const { data, error } = await supabase.rpc("scan_passport", {
        p_qr: input.code,
        p_lat: input.lat ?? null,
        p_lng: input.lng ?? null,
      });
      if (error) throw new Error(error.message);
      return data as ScanResult;
    },
    onSuccess: result => {
      if (result.ok) qc.invalidateQueries({ queryKey: ["passport"] });
    },
  });
}

/* ---------------------------------------------------------------- delicacies */
export function useDelicacies() {
  return useQuery({
    queryKey: ["delicacies"],
    queryFn: async () =>
      throwIf(
        await supabase.from("delicacies").select("*").order("featured", { ascending: false }).order("name"),
      ) as DelicacyRow[],
  });
}

export function useDelicacy(slug: string | undefined) {
  return useQuery({
    enabled: Boolean(slug),
    queryKey: ["delicacy", slug],
    queryFn: async () =>
      throwIf(await supabase.from("delicacies").select("*").eq("slug", slug!).maybeSingle()) as DelicacyRow | null,
  });
}

/* ---------------------------------------------------------------- ride guide */
export function useRideGuide() {
  return useQuery({
    queryKey: ["ride-guide"],
    queryFn: async () => {
      const [routes, tips] = await Promise.all([
        supabase.from("ride_routes").select("*").order("kind").order("sort"),
        supabase.from("ride_tips").select("*").order("sort"),
      ]);
      if (routes.error) throw new Error(routes.error.message);
      if (tips.error) throw new Error(tips.error.message);
      return {
        jeep: (routes.data as RideRoute[]).filter(r => r.kind === "jeep"),
        zones: (routes.data as RideRoute[]).filter(r => r.kind === "tricycle_zone"),
        tips: tips.data as RideTip[],
      };
    },
    staleTime: 5 * 60_000,
  });
}
