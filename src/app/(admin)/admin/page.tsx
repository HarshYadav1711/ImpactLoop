import { signOutAction } from "@/app/(auth)/actions";
import { Badge, Button, Card } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";

export default async function AdminPage() {
  const auth = await requireAdmin();

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Admin panel</h1>
            <p className="mt-1 text-sm text-zinc-600">Role-gated workspace for privileged operations.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="warning">{auth.role}</Badge>
            <form action={signOutAction}><Button variant="secondary" type="submit">Logout</Button></form>
          </div>
        </div>
      </Card>
      <Card>
        <p className="text-sm text-zinc-600">Authenticated as {auth.fullName} ({auth.email ?? "no email"}). Non-admin users are redirected to `/dashboard`.</p>
      </Card>
    </div>
  );
}
