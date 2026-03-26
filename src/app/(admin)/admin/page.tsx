import {
  publishDrawAction,
  removeScoreAction,
  simulateDrawAction,
  updatePayoutAction,
  updateSubscriptionAction,
  updateUserRoleAction,
  upsertCharityAction,
  verifyWinnerAction,
} from "@/app/(admin)/admin/actions";
import { signOutAction } from "@/app/(auth)/actions";
import { Badge, Button, Card, DataTable, EmptyState, Input, Table, Td, Th } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function toCurrency(cents: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(cents / 100);
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; tone?: "success" | "error" }>;
}) {
  const auth = await requireAdmin();
  const { message, tone } = await searchParams;
  const supabase = await createClient();

  const [profilesRes, subscriptionsRes, scoresRes, charitiesRes, drawsRes, resultsRes, payoutsRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role, created_at").order("created_at", { ascending: false }).limit(50),
    supabase
      .from("subscriptions")
      .select("id, user_id, plan, status, monthly_amount_cents, starts_on, profiles(full_name)")
      .order("starts_on", { ascending: false })
      .limit(50),
    supabase
      .from("scores")
      .select("id, user_id, played_on, course_name, stableford_points, created_at, profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("charities").select("id, name, description, is_active, created_at").order("name"),
    supabase
      .from("draws")
      .select("id, draw_month, status, rollover_cents, prize_pool_cents, simulated_at, published_at, notes")
      .order("draw_month", { ascending: false })
      .limit(12),
    supabase
      .from("draw_results")
      .select("id, draw_id, tier, prize_cents, status, winner_user_id, profiles(full_name), winner_verifications(outcome, verified_at, notes)")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("payouts")
      .select("id, draw_result_id, amount_cents, status, paid_at, reference")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const profiles = profilesRes.data ?? [];
  const subscriptions = subscriptionsRes.data ?? [];
  const scores = scoresRes.data ?? [];
  const charities = charitiesRes.data ?? [];
  const draws = drawsRes.data ?? [];
  const drawResults = resultsRes.data ?? [];
  const payouts = payoutsRes.data ?? [];

  const activeSubs = subscriptions.filter((sub) => sub.status === "active");
  const monthlyRevenueCents = activeSubs.reduce((sum, sub) => sum + sub.monthly_amount_cents, 0);
  const openVerifications = drawResults.filter((result) => result.status === "selected").length;
  const pendingPayouts = drawResults.filter((result) => result.status === "verified" || result.status === "pending").length;

  const payoutByResult = new Map(payouts.map((payout) => [payout.draw_result_id, payout]));
  const profileOptions = profiles.map((profile) => (
    <option key={profile.id} value={profile.id}>
      {profile.full_name}
    </option>
  ));

  return (
    <div className="space-y-4">
      <Card className="bg-zinc-900 text-zinc-100">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-400">Admin operations console</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">ImpactLoop control center</h1>
            <p className="mt-2 text-sm text-zinc-300">Signed in as {auth.fullName}. Manage subscriptions, eligibility, draw decisions, and payout execution.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="warning">admin</Badge>
            <form action={signOutAction}><Button variant="secondary" type="submit">Logout</Button></form>
          </div>
        </div>
        {message ? (
          <p className={`mt-4 rounded-lg px-3 py-2 text-sm ${tone === "error" ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`}>
            {message}
          </p>
        ) : null}
      </Card>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card><p className="text-xs uppercase tracking-wide text-zinc-500">Users</p><p className="mt-1 text-2xl font-semibold">{profiles.length}</p></Card>
        <Card><p className="text-xs uppercase tracking-wide text-zinc-500">Active subs</p><p className="mt-1 text-2xl font-semibold">{activeSubs.length}</p><p className="text-sm text-zinc-600">{toCurrency(monthlyRevenueCents)}/mo</p></Card>
        <Card><p className="text-xs uppercase tracking-wide text-zinc-500">Open verifications</p><p className="mt-1 text-2xl font-semibold">{openVerifications}</p></Card>
        <Card><p className="text-xs uppercase tracking-wide text-zinc-500">Pending payouts</p><p className="mt-1 text-2xl font-semibold">{pendingPayouts}</p></Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold tracking-tight">User management</h2>
          <p className="mt-1 text-sm text-zinc-600">Control role access for internal operations.</p>
          <form action={updateUserRoleAction} className="mt-4 grid gap-3 sm:grid-cols-3">
            <select aria-label="Select user for role update" name="userId" className="h-10 rounded-lg border border-zinc-300 px-3 text-sm sm:col-span-2" required>
              <option value="" disabled>Choose user</option>
              {profileOptions}
            </select>
            <select aria-label="Select role" name="role" className="h-10 rounded-lg border border-zinc-300 px-3 text-sm" defaultValue="user">
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
            <Button className="sm:col-span-3" type="submit">Update role</Button>
          </form>
          <div className="mt-4 max-h-56 overflow-auto rounded-lg border border-zinc-200">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-zinc-200">
                {profiles.map((profile) => (
                  <tr key={profile.id}>
                    <td className="px-3 py-2">{profile.full_name}</td>
                    <td className="px-3 py-2 text-right"><Badge tone={profile.role === "admin" ? "warning" : "neutral"}>{profile.role}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold tracking-tight">Subscription management</h2>
          <p className="mt-1 text-sm text-zinc-600">Assign plan, status, and billing base for draw pool calculations.</p>
          <form action={updateSubscriptionAction} className="mt-4 grid gap-3 sm:grid-cols-2">
            <select aria-label="Select user for subscription update" name="userId" className="h-10 rounded-lg border border-zinc-300 px-3 text-sm sm:col-span-2" required>
              <option value="" disabled>Choose user</option>
              {profileOptions}
            </select>
            <select aria-label="Select subscription plan" name="plan" className="h-10 rounded-lg border border-zinc-300 px-3 text-sm" defaultValue="standard">
              <option value="starter">starter</option>
              <option value="standard">standard</option>
              <option value="plus">plus</option>
            </select>
            <select aria-label="Select subscription status" name="status" className="h-10 rounded-lg border border-zinc-300 px-3 text-sm" defaultValue="active">
              <option value="active">active</option>
              <option value="inactive">inactive</option>
              <option value="paused">paused</option>
              <option value="canceled">canceled</option>
            </select>
            <Input name="monthlyAmountCents" type="number" min={0} placeholder="Monthly amount (cents)" className="sm:col-span-2" required />
            <Button className="sm:col-span-2" type="submit">Save subscription</Button>
          </form>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold tracking-tight">Score moderation</h2>
          <p className="mt-1 text-sm text-zinc-600">Remove invalid rounds before draw simulation.</p>
          {scores.length === 0 ? (
            <div className="mt-4"><EmptyState title="No scores found" description="Scores will appear here as users submit rounds." /></div>
          ) : (
            <div className="mt-4 max-h-80 overflow-auto">
              <DataTable>
                <Table>
                  <thead className="bg-zinc-50"><tr><Th>User</Th><Th>Round</Th><Th>Stableford</Th><Th>Action</Th></tr></thead>
                  <tbody className="divide-y divide-zinc-200">
                    {scores.map((score) => (
                      <tr key={score.id}>
                        <Td>{(score.profiles as { full_name?: string }[] | null)?.[0]?.full_name ?? "Unknown"}</Td>
                        <Td>{score.course_name} - {formatDate(score.played_on)}</Td>
                        <Td>{score.stableford_points}</Td>
                        <Td>
                          <form action={removeScoreAction}>
                            <input type="hidden" name="scoreId" value={score.id} />
                            <Button variant="danger" size="sm" type="submit">Remove</Button>
                          </form>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </DataTable>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold tracking-tight">Charity management</h2>
          <p className="mt-1 text-sm text-zinc-600">Create charities and toggle active status.</p>
          <form action={upsertCharityAction} className="mt-4 grid gap-3 sm:grid-cols-2">
            <Input name="name" placeholder="Charity name" className="sm:col-span-2" required />
            <Input name="description" placeholder="Charity description" className="sm:col-span-2" required />
            <Button className="sm:col-span-2" type="submit">Add charity</Button>
          </form>
          <div className="mt-4 space-y-2">
            {charities.map((charity) => (
              <div key={charity.id} className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-zinc-900">{charity.name}</p>
                  <p className="text-xs text-zinc-500">{charity.description}</p>
                </div>
                <form action={upsertCharityAction} className="flex items-center gap-2">
                  <input type="hidden" name="charityId" value={charity.id} />
                  <input type="hidden" name="isActive" value={charity.is_active ? "false" : "true"} />
                  <Button variant="secondary" size="sm" type="submit">{charity.is_active ? "Deactivate" : "Activate"}</Button>
                </form>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold tracking-tight">Draw simulation and publication</h2>
          <p className="mt-1 text-sm text-zinc-600">Deterministic weighted engine using real subscriptions and monthly scores.</p>
          <form action={simulateDrawAction} className="mt-4 flex flex-wrap gap-2">
            <Input name="drawMonth" type="month" required className="min-w-[180px] flex-1" />
            <Button type="submit">Simulate</Button>
          </form>

          <div className="mt-4 max-h-80 overflow-auto">
            <DataTable>
              <Table>
                <thead className="bg-zinc-50"><tr><Th>Month</Th><Th>Status</Th><Th>Pool</Th><Th>Rollover</Th><Th>Action</Th></tr></thead>
                <tbody className="divide-y divide-zinc-200">
                  {draws.map((draw) => (
                    <tr key={draw.id}>
                      <Td>{formatDate(draw.draw_month)}</Td>
                      <Td className="capitalize">{draw.status}</Td>
                      <Td>{toCurrency(draw.prize_pool_cents)}</Td>
                      <Td>{toCurrency(draw.rollover_cents)}</Td>
                      <Td>
                        {draw.status === "simulated" ? (
                          <form action={publishDrawAction}>
                            <input type="hidden" name="drawId" value={draw.id} />
                            <Button size="sm" type="submit">Publish</Button>
                          </form>
                        ) : (
                          <span className="text-xs text-zinc-500">-</span>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </DataTable>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold tracking-tight">Winner verification and payouts</h2>
          <p className="mt-1 text-sm text-zinc-600">Approve/reject winner records, then move payouts through processing states.</p>

          <div className="mt-4 max-h-96 overflow-auto">
            <DataTable>
              <Table>
                <thead className="bg-zinc-50"><tr><Th>Tier</Th><Th>Winner</Th><Th>Verification</Th><Th>Payout</Th></tr></thead>
                <tbody className="divide-y divide-zinc-200">
                  {drawResults.map((result) => {
                    const payout = payoutByResult.get(result.id);
                    const verification = (result.winner_verifications as { outcome?: string }[] | null)?.[0];
                    const winner = (result.profiles as { full_name?: string }[] | null)?.[0]?.full_name ?? "Unassigned";

                    return (
                      <tr key={result.id}>
                        <Td>{result.tier} - {toCurrency(result.prize_cents)}</Td>
                        <Td>{winner}</Td>
                        <Td>
                          <div className="flex flex-wrap gap-1">
                            <form action={verifyWinnerAction}>
                              <input type="hidden" name="drawResultId" value={result.id} />
                              <input type="hidden" name="outcome" value="approved" />
                              <Button size="sm" variant="secondary" type="submit">Approve</Button>
                            </form>
                            <form action={verifyWinnerAction}>
                              <input type="hidden" name="drawResultId" value={result.id} />
                              <input type="hidden" name="outcome" value="rejected" />
                              <Button size="sm" variant="danger" type="submit">Reject</Button>
                            </form>
                            <span className="text-xs text-zinc-500">{verification?.outcome ?? result.status}</span>
                          </div>
                        </Td>
                        <Td>
                          <form action={updatePayoutAction} className="flex items-center gap-2">
                            <input type="hidden" name="drawResultId" value={result.id} />
                            <select aria-label="Update payout status" name="status" defaultValue={payout?.status ?? "pending"} className="h-8 rounded-md border border-zinc-300 px-2 text-xs">
                              <option value="pending">pending</option>
                              <option value="processing">processing</option>
                              <option value="paid">paid</option>
                              <option value="failed">failed</option>
                            </select>
                            <Button size="sm" type="submit">Save</Button>
                          </form>
                          <p className="mt-1 text-xs text-zinc-500">{payout ? `${payout.status}${payout.paid_at ? ` - ${formatDate(payout.paid_at)}` : ""}` : "No payout record"}</p>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </DataTable>
          </div>
        </Card>
      </section>

      <Card>
        <h2 className="text-lg font-semibold tracking-tight">Current subscription snapshot</h2>
        {subscriptions.length === 0 ? (
          <div className="mt-4"><EmptyState title="No subscriptions" description="Create or activate subscriptions to feed draw simulations." /></div>
        ) : (
          <div className="mt-4 max-h-64 overflow-auto">
            <DataTable>
              <Table>
                <thead className="bg-zinc-50"><tr><Th>User</Th><Th>Plan</Th><Th>Status</Th><Th>Monthly amount</Th><Th>Start</Th></tr></thead>
                <tbody className="divide-y divide-zinc-200">
                  {subscriptions.map((sub) => (
                    <tr key={sub.id}>
                      <Td>{(sub.profiles as { full_name?: string }[] | null)?.[0]?.full_name ?? "Unknown"}</Td>
                      <Td className="capitalize">{sub.plan}</Td>
                      <Td className="capitalize">{sub.status}</Td>
                      <Td>{toCurrency(sub.monthly_amount_cents)}</Td>
                      <Td>{formatDate(sub.starts_on)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </DataTable>
          </div>
        )}
      </Card>
    </div>
  );
}
