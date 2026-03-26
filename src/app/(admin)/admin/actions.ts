"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { PRIZE_TIERS, explainDrawLogic, pickWinnerByTickets, tierAmount, type DrawEntry } from "@/lib/draw-engine";
import { createClient } from "@/lib/supabase/server";

function done(message: string): never {
  const params = new URLSearchParams({ message, tone: "success" });
  redirect(`/admin?${params.toString()}`);
}

function fail(message: string): never {
  const params = new URLSearchParams({ message, tone: "error" });
  redirect(`/admin?${params.toString()}`);
}

const updateUserRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["user", "admin"]),
});

const updateSubscriptionSchema = z.object({
  userId: z.string().uuid(),
  plan: z.enum(["starter", "standard", "plus"]),
  status: z.enum(["active", "inactive", "paused", "canceled"]),
  monthlyAmountCents: z.coerce.number().int().min(0).max(200000),
});

const removeScoreSchema = z.object({ scoreId: z.string().uuid() });

const upsertCharitySchema = z.object({
  charityId: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().min(8).max(240).optional(),
  isActive: z.enum(["true", "false"]).optional(),
});

const simulateDrawSchema = z.object({
  drawMonth: z.string().regex(/^\d{4}-\d{2}$/),
});

const publishDrawSchema = z.object({ drawId: z.string().uuid() });

const verifyWinnerSchema = z.object({
  drawResultId: z.string().uuid(),
  outcome: z.enum(["approved", "rejected"]),
  notes: z.string().trim().max(240).optional(),
});

const payoutSchema = z.object({
  drawResultId: z.string().uuid(),
  status: z.enum(["pending", "processing", "paid", "failed"]),
});

export async function updateUserRoleAction(formData: FormData) {
  const parsed = updateUserRoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });
  if (!parsed.success) fail("Invalid user role update.");

  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role: parsed.data.role }).eq("id", parsed.data.userId);
  if (error) fail(error.message);
  done("User role updated.");
}

export async function updateSubscriptionAction(formData: FormData) {
  const parsed = updateSubscriptionSchema.safeParse({
    userId: formData.get("userId"),
    plan: formData.get("plan"),
    status: formData.get("status"),
    monthlyAmountCents: formData.get("monthlyAmountCents"),
  });
  if (!parsed.success) fail("Invalid subscription input.");

  await requireAdmin();
  const supabase = await createClient();
  const payload = parsed.data;
  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: payload.userId,
      plan: payload.plan,
      status: payload.status,
      monthly_amount_cents: payload.monthlyAmountCents,
      starts_on: new Date().toISOString().slice(0, 10),
    },
    { onConflict: "user_id" },
  );

  if (error) fail(error.message);
  done("Subscription saved.");
}

export async function removeScoreAction(formData: FormData) {
  const parsed = removeScoreSchema.safeParse({ scoreId: formData.get("scoreId") });
  if (!parsed.success) fail("Invalid score id.");

  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("scores").delete().eq("id", parsed.data.scoreId);
  if (error) fail(error.message);
  done("Score removed.");
}

export async function upsertCharityAction(formData: FormData) {
  const parsed = upsertCharitySchema.safeParse({
    charityId: formData.get("charityId")?.toString() || undefined,
    name: formData.get("name")?.toString() || undefined,
    description: formData.get("description")?.toString() || undefined,
    isActive: formData.get("isActive")?.toString() || undefined,
  });
  if (!parsed.success) fail("Invalid charity input.");

  await requireAdmin();
  const supabase = await createClient();

  if (parsed.data.charityId) {
    const { error } = await supabase
      .from("charities")
      .update({ is_active: parsed.data.isActive === "true" })
      .eq("id", parsed.data.charityId);
    if (error) fail(error.message);
    done("Charity status updated.");
  }

  if (!parsed.data.name || !parsed.data.description) fail("Name and description are required.");

  const { error } = await supabase.from("charities").insert({
    name: parsed.data.name,
    description: parsed.data.description,
    is_active: true,
  });

  if (error) fail(error.message);
  done("Charity added.");
}

export async function simulateDrawAction(formData: FormData) {
  const parsed = simulateDrawSchema.safeParse({ drawMonth: formData.get("drawMonth") });
  if (!parsed.success) fail("Use a valid draw month.");

  const admin = await requireAdmin();
  const supabase = await createClient();

  const drawMonth = `${parsed.data.drawMonth}-01`;
  const monthStart = new Date(drawMonth);
  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);

  const { data: previousDraw } = await supabase
    .from("draws")
    .select("rollover_cents")
    .lt("draw_month", drawMonth)
    .order("draw_month", { ascending: false })
    .limit(1)
    .maybeSingle();

  const incomingRollover = previousDraw?.rollover_cents ?? 0;

  const { data: existingDraw } = await supabase
    .from("draws")
    .select("id")
    .eq("draw_month", drawMonth)
    .maybeSingle();

  let drawId = existingDraw?.id;

  if (!drawId) {
    const { data: created, error: createError } = await supabase
      .from("draws")
      .insert({
        draw_month: drawMonth,
        status: "draft",
        rollover_cents: incomingRollover,
        created_by: admin.userId,
      })
      .select("id")
      .single();

    if (createError || !created) fail(createError?.message ?? "Failed to create draw.");
    drawId = created.id;
  }

  const { data: activeSubs, error: subError } = await supabase
    .from("subscriptions")
    .select("user_id, monthly_amount_cents")
    .eq("status", "active");

  if (subError) fail(subError.message);

  const eligibleUsers = (activeSubs ?? []).map((row) => row.user_id);

  const { data: monthlyScores, error: scoreError } = await supabase
    .from("scores")
    .select("id, user_id, stableford_points, created_at")
    .in("user_id", eligibleUsers.length ? eligibleUsers : ["00000000-0000-0000-0000-000000000000"])
    .gte("played_on", drawMonth)
    .lt("played_on", monthEnd.toISOString().slice(0, 10))
    .order("created_at", { ascending: false });

  if (scoreError) fail(scoreError.message);

  const latestScoreByUser = new Map<string, { id: string; stableford_points: number }>();
  for (const score of monthlyScores ?? []) {
    if (!latestScoreByUser.has(score.user_id)) {
      latestScoreByUser.set(score.user_id, { id: score.id, stableford_points: score.stableford_points });
    }
  }

  const entriesToInsert = [...latestScoreByUser.entries()].map(([userId, score]) => ({
    draw_id: drawId,
    user_id: userId,
    source_score_id: score.id,
    ticket_count: Math.max(1, score.stableford_points),
  }));

  const monthlyPool = (activeSubs ?? []).reduce((sum, sub) => sum + Math.floor(sub.monthly_amount_cents * 0.7), 0);
  const totalPrizeBudget = monthlyPool + incomingRollover;

  const { error: deleteEntriesError } = await supabase.from("draw_entries").delete().eq("draw_id", drawId);
  if (deleteEntriesError) fail(deleteEntriesError.message);

  if (entriesToInsert.length) {
    const { error: insertEntriesError } = await supabase.from("draw_entries").insert(entriesToInsert);
    if (insertEntriesError) fail(insertEntriesError.message);
  }

  const { data: persistedEntries, error: entryFetchError } = await supabase
    .from("draw_entries")
    .select("id, user_id, ticket_count")
    .eq("draw_id", drawId);

  if (entryFetchError) fail(entryFetchError.message);

  const ordered = (persistedEntries ?? []).sort((a, b) => (a.user_id > b.user_id ? 1 : -1));
  const available: DrawEntry[] = ordered.map((entry) => ({
    id: entry.id,
    user_id: entry.user_id,
    ticket_count: entry.ticket_count,
  }));

  const resultsToInsert: Array<{
    draw_id: string;
    tier: string;
    prize_cents: number;
    winner_entry_id: string | null;
    winner_user_id: string | null;
    status: "pending" | "selected";
  }> = [];

  let rollover = 0;

  for (const tier of PRIZE_TIERS) {
    const prize = tierAmount(totalPrizeBudget, tier.percentage);
    const winner = pickWinnerByTickets(available, `${drawMonth}:${tier.tier}:${drawId}`);

    if (!winner) {
      rollover += prize;
      resultsToInsert.push({
        draw_id: drawId,
        tier: tier.tier,
        prize_cents: prize,
        winner_entry_id: null,
        winner_user_id: null,
        status: "pending",
      });
      continue;
    }

    resultsToInsert.push({
      draw_id: drawId,
      tier: tier.tier,
      prize_cents: prize,
      winner_entry_id: winner.id,
      winner_user_id: winner.user_id,
      status: "selected",
    });

    const idx = available.findIndex((entry) => entry.user_id === winner.user_id);
    if (idx >= 0) available.splice(idx, 1);
  }

  const { error: deleteResultsError } = await supabase.from("draw_results").delete().eq("draw_id", drawId);
  if (deleteResultsError) fail(deleteResultsError.message);

  const { error: insertResultsError } = await supabase.from("draw_results").insert(resultsToInsert);
  if (insertResultsError) fail(insertResultsError.message);

  const { error: drawUpdateError } = await supabase
    .from("draws")
    .update({
      status: "simulated",
      rollover_cents: rollover,
      prize_pool_cents: monthlyPool,
      simulated_at: new Date().toISOString(),
      notes: explainDrawLogic(),
    })
    .eq("id", drawId);

  if (drawUpdateError) fail(drawUpdateError.message);

  done("Draw simulated with deterministic winner selection.");
}

export async function publishDrawAction(formData: FormData) {
  const parsed = publishDrawSchema.safeParse({ drawId: formData.get("drawId") });
  if (!parsed.success) fail("Invalid draw id.");

  await requireAdmin();
  const supabase = await createClient();

  const { data: draw } = await supabase.from("draws").select("status").eq("id", parsed.data.drawId).maybeSingle();
  if (!draw || draw.status !== "simulated") fail("Draw must be simulated before publishing.");

  const { count } = await supabase
    .from("draw_results")
    .select("id", { count: "exact", head: true })
    .eq("draw_id", parsed.data.drawId);
  if (!count) fail("Simulated draw has no results to publish.");

  const { error } = await supabase
    .from("draws")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", parsed.data.drawId);

  if (error) fail(error.message);
  done("Draw published.");
}

export async function verifyWinnerAction(formData: FormData) {
  const parsed = verifyWinnerSchema.safeParse({
    drawResultId: formData.get("drawResultId"),
    outcome: formData.get("outcome"),
    notes: formData.get("notes")?.toString() || undefined,
  });
  if (!parsed.success) fail("Invalid verification input.");

  const admin = await requireAdmin();
  const supabase = await createClient();

  const { error: verifyError } = await supabase.from("winner_verifications").upsert(
    {
      draw_result_id: parsed.data.drawResultId,
      verified_by: admin.userId,
      verified_at: new Date().toISOString(),
      outcome: parsed.data.outcome,
      notes: parsed.data.notes ?? null,
      method: "admin-review",
    },
    { onConflict: "draw_result_id" },
  );

  if (verifyError) fail(verifyError.message);

  const nextStatus = parsed.data.outcome === "approved" ? "verified" : "pending";
  const { error: resultError } = await supabase.from("draw_results").update({ status: nextStatus }).eq("id", parsed.data.drawResultId);
  if (resultError) fail(resultError.message);

  done(`Winner ${parsed.data.outcome}.`);
}

export async function updatePayoutAction(formData: FormData) {
  const parsed = payoutSchema.safeParse({
    drawResultId: formData.get("drawResultId"),
    status: formData.get("status"),
  });
  if (!parsed.success) fail("Invalid payout update.");

  const admin = await requireAdmin();
  const supabase = await createClient();

  const { data: result } = await supabase
    .from("draw_results")
    .select("prize_cents")
    .eq("id", parsed.data.drawResultId)
    .maybeSingle();

  if (!result) fail("Draw result not found.");

  const paidAt = parsed.data.status === "paid" ? new Date().toISOString() : null;

  const { error: payoutError } = await supabase.from("payouts").upsert(
    {
      draw_result_id: parsed.data.drawResultId,
      amount_cents: result.prize_cents,
      status: parsed.data.status,
      processed_by: admin.userId,
      paid_at: paidAt,
      reference: `PAYOUT-${parsed.data.drawResultId.slice(0, 8)}`,
    },
    { onConflict: "draw_result_id" },
  );

  if (payoutError) fail(payoutError.message);

  if (parsed.data.status === "paid") {
    const { error: resultError } = await supabase.from("draw_results").update({ status: "paid" }).eq("id", parsed.data.drawResultId);
    if (resultError) fail(resultError.message);
  }

  done("Payout status updated.");
}
