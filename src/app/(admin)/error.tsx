"use client";

import { ErrorState } from "@/components/state";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="space-y-3">
      <ErrorState title="Admin console unavailable" message="Please retry. If it persists, check Supabase connectivity." />
      <button onClick={reset} className="text-sm underline">Retry loading admin</button>
    </div>
  );
}
