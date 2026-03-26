"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const scoreSchema = z.object({
  playedOn: z.string().date("Select a valid play date."),
  courseName: z.string().trim().min(2, "Course name is required.").max(80),
  stablefordPoints: z.coerce.number().int().min(0).max(72),
  stablefordClass: z.string().trim().max(20).optional(),
  grossScore: z
    .string()
    .optional()
    .transform((value) => (value ? Number(value) : null))
    .pipe(z.number().int().min(40).max(200).nullable()),
  handicapIndex: z
    .string()
    .optional()
    .transform((value) => (value ? Number(value) : null))
    .pipe(z.number().min(0).max(54).nullable()),
});

const charitySchema = z.object({
  charityId: z.string().uuid("Select a valid charity."),
});

function withMessage(message: string, tone: "success" | "error") {
  const params = new URLSearchParams({ message, tone });
  return `/dashboard?${params.toString()}`;
}

export async function addScoreAction(formData: FormData) {
  const parsed = scoreSchema.safeParse({
    playedOn: formData.get("playedOn"),
    courseName: formData.get("courseName"),
    stablefordPoints: formData.get("stablefordPoints"),
    stablefordClass: formData.get("stablefordClass") || undefined,
    grossScore: formData.get("grossScore")?.toString(),
    handicapIndex: formData.get("handicapIndex")?.toString(),
  });

  if (!parsed.success) {
    redirect(withMessage(parsed.error.issues[0]?.message ?? "Invalid score input.", "error"));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const payload = parsed.data;
  const { error: insertError } = await supabase.from("scores").insert({
    user_id: user.id,
    played_on: payload.playedOn,
    course_name: payload.courseName,
    stableford_points: payload.stablefordPoints,
    stableford_class: payload.stablefordClass || null,
    gross_score: payload.grossScore,
    handicap_index: payload.handicapIndex,
  });

  if (insertError) {
    redirect(withMessage(insertError.message, "error"));
  }

  const { data: scoreIds, error: scoreFetchError } = await supabase
    .from("scores")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (scoreFetchError) {
    redirect(withMessage(scoreFetchError.message, "error"));
  }

  if ((scoreIds?.length ?? 0) > 5) {
    const staleIds = scoreIds!.slice(5).map((row) => row.id);
    const { error: deleteError } = await supabase.from("scores").delete().in("id", staleIds);
    if (deleteError) {
      redirect(withMessage(deleteError.message, "error"));
    }
  }

  redirect(withMessage("Score saved. Your latest five rounds are retained.", "success"));
}

export async function updateCharityAction(formData: FormData) {
  const parsed = charitySchema.safeParse({
    charityId: formData.get("charityId"),
  });

  if (!parsed.success) {
    redirect(withMessage(parsed.error.issues[0]?.message ?? "Invalid charity input.", "error"));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.from("user_charities").upsert(
    {
      user_id: user.id,
      charity_id: parsed.data.charityId,
      allocation_percent: 20,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    redirect(withMessage(error.message, "error"));
  }

  redirect(withMessage("Charity selection updated.", "success"));
}
