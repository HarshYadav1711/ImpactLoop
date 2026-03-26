"use client";

import { Button, Card } from "@/components/ui";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-10">
      <Card>
        <h1 className="text-xl font-semibold tracking-tight">Unexpected error</h1>
        <p className="mt-2 text-sm text-zinc-600">Something failed while loading this page.</p>
        <Button className="mt-4" onClick={reset}>Try again</Button>
      </Card>
    </main>
  );
}
