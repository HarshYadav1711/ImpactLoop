"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const signInSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required.").max(80),
  email: z.string().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

function withError(path: string, message: string) {
  const params = new URLSearchParams({ error: message });
  return `${path}?${params.toString()}`;
}

export async function signInAction(formData: FormData) {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(withError("/login", parsed.error.issues[0]?.message ?? "Invalid credentials."));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    redirect(withError("/login", error.message));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(withError("/login", "Unable to load user session."));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  redirect(profile?.role === "admin" ? "/admin" : "/dashboard");
}

export async function signUpAction(formData: FormData) {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(withError("/signup", parsed.error.issues[0]?.message ?? "Invalid details."));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    redirect(withError("/signup", error.message));
  }

  if (data.user) {
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: data.user.id,
      full_name: parsed.data.fullName,
      role: "user",
    });

    if (profileError) {
      redirect(withError("/signup", profileError.message));
    }
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
