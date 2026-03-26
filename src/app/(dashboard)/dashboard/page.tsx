import { signOutAction } from "@/app/(auth)/actions";
import { Badge, Button, Card, DataTable, EmptyState, Input, Table, Td, Th } from "@/components/ui";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { addScoreAction, updateCharityAction } from "./actions";

function toCurrency(cents: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(cents / 100);
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; tone?: "success" | "error" }>;
}) {
  const auth = await requireAuth();
  const { message, tone } = await searchParams;
  const supabase = await createClient();

  const [subscriptionRes, scoresRes, charitiesRes, userCharityRes, drawRes, winningsRes] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("plan, status, monthly_amount_cents, starts_on")
      .eq("user_id", auth.userId)
      .maybeSingle(),
    supabase
      .from("scores")
      .select("id, played_on, course_name, stableford_points, stableford_class, gross_score, handicap_index, created_at")
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("charities").select("id, name, description").eq("is_active", true).order("name"),
    supabase
      .from("user_charities")
      .select("charity_id, allocation_percent")
      .eq("user_id", auth.userId)
      .maybeSingle(),
    supabase
      .from("draws")
      .select("id, draw_month, status")
      .order("draw_month", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("draw_results")
      .select("id, tier, prize_cents, status, created_at, payouts(status, amount_cents, paid_at), draws(draw_month)")
      .eq("winner_user_id", auth.userId)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const subscription = subscriptionRes.data;
  const scores = scoresRes.data ?? [];
  const charities = charitiesRes.data ?? [];
  const userCharity = userCharityRes.data;
  const latestDraw = drawRes.data;
  const winnings = winningsRes.data ?? [];

  const { data: drawEntry } = latestDraw
    ? await supabase
        .from("draw_entries")
        .select("ticket_count")
        .eq("draw_id", latestDraw.id)
        .eq("user_id", auth.userId)
        .maybeSingle()
    : { data: null };

  const selectedCharity = charities.find((charity) => charity.id === userCharity?.charity_id);
  const allocationPercent = userCharity?.allocation_percent ?? 0;
  const monthlyContributionCents = Math.round((subscription?.monthly_amount_cents ?? 0) * (allocationPercent / 100));
  const annualProjectionCents = monthlyContributionCents * 12;

  const winningsTotalCents = winnings.reduce((sum, item) => {
    const payoutAmount = (item.payouts as { amount_cents?: number }[] | null)?.[0]?.amount_cents ?? 0;
    return sum + payoutAmount;
  }, 0);

  return (
    <div className="space-y-5">
      <Card className="bg-gradient-to-b from-white to-zinc-50">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Welcome back, {auth.fullName}</h1>
            <p className="mt-1 text-sm text-zinc-600">Your subscription and impact activity, all in one place.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={subscription?.status === "active" ? "success" : "warning"}>{subscription?.status ?? "inactive"}</Badge>
            <form action={signOutAction}><Button variant="secondary" type="submit">Logout</Button></form>
          </div>
        </div>
        {message ? (
          <p className={`mt-4 rounded-lg px-3 py-2 text-sm ${tone === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
            {message}
          </p>
        ) : null}
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Subscription</p>
          <p className="mt-1 text-lg font-semibold capitalize">{subscription?.plan ?? "No plan"}</p>
          <p className="mt-1 text-sm text-zinc-600">{subscription ? `${toCurrency(subscription.monthly_amount_cents)}/month` : "Choose a plan to start monthly contributions."}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Current charity</p>
          <p className="mt-1 text-lg font-semibold">{selectedCharity?.name ?? "Not selected"}</p>
          <p className="mt-1 text-sm text-zinc-600">{selectedCharity?.description ?? "Pick a charity to direct your monthly allocation."}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Monthly contribution</p>
          <p className="mt-1 text-lg font-semibold">{toCurrency(monthlyContributionCents)}</p>
          <p className="mt-1 text-sm text-zinc-600">{allocationPercent}% of your subscription allocation.</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Winnings paid</p>
          <p className="mt-1 text-lg font-semibold">{toCurrency(winningsTotalCents)}</p>
          <p className="mt-1 text-sm text-zinc-600">Total payouts confirmed to date.</p>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Last five scores</h2>
              <p className="text-sm text-zinc-600">Newest rounds appear first. Older rounds are automatically archived after five entries.</p>
            </div>
            <Badge tone="neutral">{scores.length}/5 stored</Badge>
          </div>

          <form action={addScoreAction} className="mt-4 grid gap-3 sm:grid-cols-2">
            <Input name="playedOn" type="date" required />
            <Input name="courseName" placeholder="Course name" required />
            <Input name="stablefordPoints" type="number" min={0} max={72} placeholder="Stableford points" required />
            <Input name="stablefordClass" placeholder="Stableford class (optional)" />
            <Input name="grossScore" type="number" min={40} max={200} placeholder="Gross score (optional)" />
            <Input name="handicapIndex" type="number" min={0} max={54} step="0.1" placeholder="Handicap index (optional)" />
            <Button className="sm:col-span-2" type="submit">Save round</Button>
          </form>

          <div className="mt-4">
            {scores.length === 0 ? (
              <EmptyState
                title="No scores yet"
                description="Add your first round to activate draw entry tracking and keep your profile current."
              />
            ) : (
              <DataTable>
                <Table>
                  <thead className="bg-zinc-50">
                    <tr>
                      <Th>Date</Th>
                      <Th>Course</Th>
                      <Th>Stableford</Th>
                      <Th>Gross</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {scores.map((score) => (
                      <tr key={score.id}>
                        <Td>{formatDate(score.played_on)}</Td>
                        <Td>{score.course_name}</Td>
                        <Td>{score.stableford_points}{score.stableford_class ? ` (${score.stableford_class})` : ""}</Td>
                        <Td>{score.gross_score ?? "-"}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </DataTable>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <h2 className="text-lg font-semibold tracking-tight">Charity allocation</h2>
            <p className="mt-1 text-sm text-zinc-600">Select the charity receiving your current monthly allocation.</p>
            <form action={updateCharityAction} className="mt-4 space-y-3">
              <select
                name="charityId"
                defaultValue={userCharity?.charity_id ?? ""}
                className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
                required
              >
                <option value="" disabled>
                  Choose a charity
                </option>
                {charities.map((charity) => (
                  <option key={charity.id} value={charity.id}>
                    {charity.name}
                  </option>
                ))}
              </select>
              <Button className="w-full" type="submit">Update charity</Button>
            </form>
            <p className="mt-3 text-xs text-zinc-500">Current allocation: {allocationPercent}% ({toCurrency(monthlyContributionCents)}/month, {toCurrency(annualProjectionCents)}/year projected).</p>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold tracking-tight">Draw participation</h2>
            {latestDraw ? (
              <div className="mt-2 space-y-2 text-sm text-zinc-700">
                <p>Latest draw month: <span className="font-medium">{formatDate(latestDraw.draw_month)}</span></p>
                <p>Status: <span className="font-medium capitalize">{latestDraw.status}</span></p>
                <p>{drawEntry ? `You are entered with ${drawEntry.ticket_count} ticket${drawEntry.ticket_count > 1 ? "s" : ""}.` : "No entry yet for the latest draw."}</p>
              </div>
            ) : (
              <EmptyState title="No draw published yet" description="Once draws are scheduled, your participation status will appear here." />
            )}
          </Card>
        </div>
      </div>

      <Card>
        <h2 className="text-lg font-semibold tracking-tight">Winnings and payout status</h2>
        <p className="mt-1 text-sm text-zinc-600">Track prize outcomes and payout progress in one place.</p>

        {winnings.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No winnings recorded"
              description="If you win a draw tier, payout status will update here automatically."
            />
          </div>
        ) : (
          <div className="mt-4">
            <DataTable>
              <Table>
                <thead className="bg-zinc-50">
                  <tr>
                    <Th>Draw month</Th>
                    <Th>Tier</Th>
                    <Th>Prize</Th>
                    <Th>Result status</Th>
                    <Th>Payout</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {winnings.map((row) => {
                    const payout = (row.payouts as { status?: string; amount_cents?: number; paid_at?: string | null }[] | null)?.[0];
                    const draw = (row.draws as { draw_month?: string }[] | null)?.[0];

                    return (
                      <tr key={row.id}>
                        <Td>{formatDate(draw?.draw_month ?? null)}</Td>
                        <Td>{row.tier}</Td>
                        <Td>{toCurrency(row.prize_cents)}</Td>
                        <Td className="capitalize">{row.status}</Td>
                        <Td>
                          {payout ? (
                            <span className="capitalize">{payout.status} {payout.paid_at ? `- ${formatDate(payout.paid_at)}` : ""}</span>
                          ) : (
                            "Pending"
                          )}
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </DataTable>
          </div>
        )}
      </Card>
    </div>
  );
}
