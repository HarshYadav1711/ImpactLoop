import Link from "next/link";
import { Badge, Button, Card, EmptyState } from "@/components/ui";

export default function MarketingHomePage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-10">
        <Badge>Foundation ready</Badge>
        <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">Build a credible, production-grade subscription platform.</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600">This scaffold provides route boundaries, polished UI primitives, and Supabase-ready architecture for the next implementation phase.</p>
        <div className="mt-5 flex gap-2">
          <Link href="/signup"><Button>Create account</Button></Link>
          <Link href="/dashboard"><Button variant="secondary">View app shell</Button></Link>
        </div>
      </section>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card><h2 className="font-semibold">Public routes</h2><p className="mt-2 text-sm text-zinc-600">Marketing pages and non-auth entry points.</p></Card>
        <Card><h2 className="font-semibold">Protected routes</h2><p className="mt-2 text-sm text-zinc-600">Dashboard and admin shells with room for auth guards.</p></Card>
      </div>
      <EmptyState title="No live data yet" description="Connect Supabase tables and server actions in the next phase." />
    </div>
  );
}
