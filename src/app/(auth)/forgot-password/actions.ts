"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address."),
});

function withMessage(path: string, message: string, tone: "success" | "error") {
  const params = new URLSearchParams({ message, tone });
  return `${path}?${params.toString()}`;
}

export async function forgotPasswordAction(formData: FormData) {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    redirect(withMessage("/forgot-password", parsed.error.issues[0]?.message ?? "Invalid email.", "error"));
  }

  const supabase = await createClient();
  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/login`;

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo });

  if (error) {
    redirect(withMessage("/forgot-password", error.message, "error"));
  }

  redirect(withMessage("/forgot-password", "If your account exists, a reset link has been sent.", "success"));
}
