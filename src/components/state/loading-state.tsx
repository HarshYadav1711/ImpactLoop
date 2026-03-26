export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
      <span className="size-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
      <span>{label}</span>
    </div>
  );
}
