import Link from "next/link";
import { Card, Button } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";

export default async function AdminUsersPage() {
  await requireAdmin();

  return (
    <Card>
      <h1 className="text-xl font-semibold tracking-tight">User operations moved</h1>
      <p className="mt-2 text-sm text-zinc-600">User, subscription, moderation, draw, verification, and payout operations are managed in the unified admin console.</p>
      <Link href="/admin" className="mt-4 inline-block"><Button>Open admin console</Button></Link>
    </Card>
  );
}
