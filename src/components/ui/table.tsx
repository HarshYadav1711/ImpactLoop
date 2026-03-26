import type { PropsWithChildren } from "react";
import { cn } from "@/lib";

export function DataTable({ children }: PropsWithChildren) {
  return <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">{children}</div>;
}

export function Table({ children }: PropsWithChildren) {
  return <table className="min-w-full divide-y divide-zinc-200">{children}</table>;
}

export function Th({ children }: PropsWithChildren) {
  return <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">{children}</th>;
}

export function Td({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <td className={cn("px-4 py-3 text-sm text-zinc-700", className)}>{children}</td>;
}
