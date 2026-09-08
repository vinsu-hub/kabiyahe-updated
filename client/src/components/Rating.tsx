import { Star } from "lucide-react";

/** One rating treatment used everywhere a place / tour / delicacy shows its (seed) rating.
    Renders nothing when there is no usable value, so callers can drop it in unconditionally. */
export function Rating({ value, count }: { value?: number | null; count?: number | null }) {
  if (value == null || Number.isNaN(Number(value))) return null;
  return (
    <span className="rating">
      <Star size={14} fill="currentColor" /> {Number(value).toFixed(1)} <small>({count ?? 0})</small>
    </span>
  );
}
