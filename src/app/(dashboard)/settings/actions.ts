"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const settingsSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
});

function withMessage(message: string, tone: "success" | "error") {
  const params = new URLSearchParams({ message, tone });
  return `/settings?${params.toString()}`;
}

export async function updateProfileAction(formData: FormData) {
  const auth = await requireAuth();

  const parsed = settingsSchema.safeParse({
    fullName: formData.get("fullName"),
  });

  if (!parsed.success) {
    redirect(withMessage(parsed.error.issues[0]?.message ?? "Invalid profile input.", "error"));
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", auth.userId);

  if (error) {
    redirect(withMessage(error.message, "error"));
  }

  redirect(withMessage("Profile updated.", "success"));
}
