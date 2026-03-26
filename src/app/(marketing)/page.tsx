import Link from "next/link";
import { Badge, Button, Card } from "@/components/ui";

export default function MarketingHomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-10">
        <Badge>ImpactLoop</Badge>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
          Subscription golf impact, managed like a serious operations product.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-600 sm:text-base">
          Members log scores, support a chosen charity, and enter monthly prize draws. Admins simulate, verify, and
          settle outcomes through a clear, auditable workflow.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/signup"><Button>Create account</Button></Link>
          <Link href="/login"><Button variant="secondary">Sign in</Button></Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <h2 className="text-base font-semibold text-zinc-900">Member dashboard</h2>
          <p className="mt-2 text-sm text-zinc-600">Track subscription, latest five rounds, charity allocation, draw status, and payouts.</p>
        </Card>
        <Card>
          <h2 className="text-base font-semibold text-zinc-900">Admin control center</h2>
          <p className="mt-2 text-sm text-zinc-600">Operate user, subscription, moderation, draw publication, verification, and payout flows.</p>
        </Card>
        <Card>
          <h2 className="text-base font-semibold text-zinc-900">Deterministic draw engine</h2>
          <p className="mt-2 text-sm text-zinc-600">Weighted by real score data with explainable tier and rollover behavior.</p>
        </Card>
      </section>
    </div>
  );
}
