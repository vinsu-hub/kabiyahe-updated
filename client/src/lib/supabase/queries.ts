/* React-Query hooks over Supabase for the El-Biyahe! feature tabs. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./client";
import { useAuth } from "./AuthProvider";
import type {
  AccommodationRow, DelicacyRow, DestinationRow, EventDetailRow, EventRow, HeritageWalkStop, LeaderboardRow,
  ParkingSpotRow, PassportLocationPublic, PassportMission, PassportReward, RideRoute, RideTip, ScanResult, Season,
  TourPackageDetail, TourPackageRow,
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
  eventsJoinedCount: number;
  joinedAt: string | null;
}

/** Shared by usePassport (Events Joined stat) and usePassportMissions (event_rsvps metric). */
async function fetchEventRsvpCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("event_rsvps")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return count ?? 0;
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
      let eventsJoinedCount = 0;
      let joinedAt: string | null = null;
      if (user) {
        const [scans, profile, eventsJoined] = await Promise.all([
          supabase.from("passport_scans").select("location_id").eq("user_id", user.id),
          supabase.from("profiles").select("xp, explorer_level, created_at").eq("id", user.id).maybeSingle(),
          fetchEventRsvpCount(user.id),
        ]);
        scannedLocationIds = (scans.data ?? []).map(s => s.location_id as string);
        xp = profile.data?.xp ?? 0;
        explorerLevel = profile.data?.explorer_level ?? 1;
        joinedAt = profile.data?.created_at ?? null;
        eventsJoinedCount = eventsJoined;
      }
      return {
        locations: locations.data as PassportLocationPublic[],
        scannedLocationIds,
        rewards: rewards.data as PassportReward[],
        xp,
        explorerLevel,
        eventsJoinedCount,
        joinedAt,
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

export interface PassportMissionsState {
  missions: PassportMission[];
  progressByMissionId: Record<string, number>;
  completedMissionIds: string[];
}

export function usePassportMissions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["passport-missions", user?.id ?? "guest"],
    queryFn: async (): Promise<PassportMissionsState> => {
      const missionsRes = await supabase.from("passport_missions").select("*").eq("active", true).order("sort");
      if (missionsRes.error) throw new Error(missionsRes.error.message);
      const missions = missionsRes.data as PassportMission[];

      const progressByMissionId: Record<string, number> = {};
      let completedMissionIds: string[] = [];

      if (user && missions.length) {
        // passport_locations' base table is admin-only under RLS — join client-side against the
        // public view instead of embedding it in the scans query (an embedded !inner join is
        // evaluated under the same RLS and silently returns zero rows for non-admin users).
        const [scansRes, locationsRes, completionsRes, eventsJoinedCount] = await Promise.all([
          supabase.from("passport_scans").select("location_id").eq("user_id", user.id),
          supabase.from("passport_locations_public").select("id, category"),
          supabase.from("mission_completions").select("mission_id").eq("user_id", user.id),
          fetchEventRsvpCount(user.id),
        ]);
        if (scansRes.error) throw new Error(scansRes.error.message);
        if (locationsRes.error) throw new Error(locationsRes.error.message);
        if (completionsRes.error) throw new Error(completionsRes.error.message);

        const categoryByLocationId = new Map((locationsRes.data ?? []).map(l => [l.id, l.category as string]));
        const scanRows = scansRes.data ?? [];
        const totalScans = scanRows.length;
        const scansByCategory = new Map<string, number>();
        for (const row of scanRows) {
          const cat = categoryByLocationId.get(row.location_id as string);
          if (cat) scansByCategory.set(cat, (scansByCategory.get(cat) ?? 0) + 1);
        }

        for (const m of missions) {
          if (m.metric === "category_scans") progressByMissionId[m.id] = scansByCategory.get(m.category ?? "") ?? 0;
          else if (m.metric === "total_scans") progressByMissionId[m.id] = totalScans;
          else progressByMissionId[m.id] = eventsJoinedCount;
        }
        completedMissionIds = (completionsRes.data ?? []).map(c => c.mission_id as string);
      } else {
        for (const m of missions) progressByMissionId[m.id] = 0;
      }

      return { missions, progressByMissionId, completedMissionIds };
    },
  });
}

export function useClaimMission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (missionId: string): Promise<{ ok: boolean; reason?: string; message?: string; xp_awarded?: number }> => {
      const { data, error } = await supabase.rpc("claim_mission", { p_mission_id: missionId });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: result => {
      if (result.ok) {
        qc.invalidateQueries({ queryKey: ["passport-missions"] });
        qc.invalidateQueries({ queryKey: ["passport"] });
      }
    },
  });
}

export interface LeaderboardState {
  top: LeaderboardRow[];
  me: (LeaderboardRow & { rank: number }) | null;
  meInTop: boolean;
}

export function useLeaderboard() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["leaderboard", user?.id ?? "guest"],
    queryFn: async (): Promise<LeaderboardState> => {
      const topRes = await supabase.from("profiles_public").select("*").order("xp", { ascending: false }).limit(20);
      if (topRes.error) throw new Error(topRes.error.message);
      const top = topRes.data as LeaderboardRow[];
      const meInTop = Boolean(user && top.some(r => r.id === user.id));

      let me: (LeaderboardRow & { rank: number }) | null = null;
      if (user && !meInTop) {
        const mineRes = await supabase.from("profiles_public").select("*").eq("id", user.id).maybeSingle();
        if (mineRes.error) throw new Error(mineRes.error.message);
        if (mineRes.data) {
          const mine = mineRes.data as LeaderboardRow;
          const rankRes = await supabase
            .from("profiles_public")
            .select("id", { count: "exact", head: true })
            .gt("xp", mine.xp);
          if (rankRes.error) throw new Error(rankRes.error.message);
          me = { ...mine, rank: (rankRes.count ?? 0) + 1 };
        }
      }

      return { top, me, meInTop };
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

export function useSubmitDelicacySuggestion() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { name: string; place: string; note: string }) => {
      if (!user) throw new Error("auth");
      const { error } = await supabase.from("delicacy_suggestions").insert({ ...input, submitted_by: user.id });
      if (error) throw new Error(error.message);
      return true;
    },
  });
}

/* ------------------------------------------------------------ accommodations */
export function useAccommodations() {
  return useQuery({
    queryKey: ["accommodations"],
    queryFn: async () =>
      throwIf(
        await supabase.from("accommodations").select("*").order("featured", { ascending: false }).order("name"),
      ) as AccommodationRow[],
  });
}

export function useReserveAccommodation() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (stay: { id: string; booking_referral_url: string | null; name: string }) => {
      if (!user) throw new Error("auth");
      // Referral-only, mirrors useReserveTour: log the hand-off, never process payment.
      await supabase.from("referral_events").insert({
        type: "accommodation_booking",
        entity_id: stay.id,
        user_id: user.id,
        meta: { name: stay.name },
      });
      if (stay.booking_referral_url) window.open(stay.booking_referral_url, "_blank", "noopener");
      return true;
    },
  });
}

/* ------------------------------------------------------------ destinations */
export function useDestinations() {
  return useQuery({
    queryKey: ["destinations"],
    queryFn: async () =>
      throwIf(await supabase.from("destinations").select("*").order("name")) as DestinationRow[],
    staleTime: 60_000,
  });
}

export function useDestination(slug: string | undefined) {
  return useQuery({
    enabled: Boolean(slug),
    queryKey: ["destination", slug],
    queryFn: async () =>
      throwIf(await supabase.from("destinations").select("*").eq("slug", slug!).maybeSingle()) as DestinationRow | null,
  });
}

/* ------------------------------------------------------------ heritage walk */
export function useHeritageWalk() {
  return useQuery({
    queryKey: ["heritage-walk"],
    queryFn: async () =>
      throwIf(await supabase.from("heritage_walk_stops").select("*").order("sort")) as HeritageWalkStop[],
    staleTime: 10 * 60_000,
  });
}

/* --------------------------------------------------------------- parking */
export function useParkingSpots() {
  return useQuery({
    queryKey: ["parking-spots"],
    queryFn: async () =>
      throwIf(await supabase.from("parking_spots").select("*").order("name")) as ParkingSpotRow[],
    staleTime: 5 * 60_000,
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
