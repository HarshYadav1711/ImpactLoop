import type { ComponentProps } from "react";
import { cn } from "@/lib";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn("h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none", className)} {...props} />;
}
