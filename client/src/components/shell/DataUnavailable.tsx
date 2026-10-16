import { useState } from "react";
import { conceptImages } from "@/lib/conceptImages";
import { Button } from "./legacy";

/** Shared, recoverable feedback for unavailable backend data. */
export function DataUnavailable({ onRetry }: { onRetry: () => unknown | Promise<unknown> }) {
  const [retrying, setRetrying] = useState(false);
  async function retry() {
    setRetrying(true);
    try { await onRetry(); } finally { setRetrying(false); }
  }
  return <div className="empty-state data-unavailable" role="status" data-testid="data-unavailable">
    <img className="data-unavailable-art" src={conceptImages.stateOffline.src} alt="" width={140} height={140} />
    <h3>We can't reach our listings right now.</h3>
    <p>Please try again in a moment.</p>
    <Button onClick={retry} disabled={retrying}>{retrying ? "Trying again…" : "Retry"}</Button>
  </div>;
}
