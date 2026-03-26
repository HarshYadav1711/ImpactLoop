"use client";

import { ErrorState } from "@/components/state";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="space-y-3">
      <ErrorState title="Dashboard unavailable" message="Please refresh and try again." />
      <button onClick={reset} className="text-sm underline">Retry loading dashboard</button>
    </div>
  );
}
