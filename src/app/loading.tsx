import { LoadingState } from "@/components/state";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <LoadingState label="Loading page..." />
    </main>
  );
}
