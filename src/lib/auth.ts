import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AppRole = "user" | "admin";

export interface AuthContext {
  userId: string;
  email: string | null;
  fullName: string;
  role: AppRole;
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    fullName: profile.full_name,
    role: profile.role,
  };
}

export async function requireAuth(): Promise<AuthContext> {
  const context = await getAuthContext();
  if (!context) {
    redirect("/login");
  }
  return context;
}

export async function requireAdmin(): Promise<AuthContext> {
  const context = await requireAuth();
  if (context.role !== "admin") {
    redirect("/dashboard");
  }
  return context;
}
