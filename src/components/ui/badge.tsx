import type { PropsWithChildren } from "react";
import { cn } from "@/lib";

type BadgeTone = "neutral" | "success" | "warning" | "danger";

const toneClass: Record<BadgeTone, string> = {
  neutral: "bg-zinc-100 text-zinc-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
};

export function Badge({ children, tone = "neutral" }: PropsWithChildren<{ tone?: BadgeTone }>) {
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", toneClass[tone])}>{children}</span>;
}
