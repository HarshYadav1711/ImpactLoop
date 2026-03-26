import type { PropsWithChildren } from "react";
import { cn } from "@/lib";

export function Card({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <section className={cn("rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm", className)}>{children}</section>;
}
