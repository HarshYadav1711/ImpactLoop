import { signOutAction } from "@/app/(auth)/actions";
import { Badge, Button, Card, Input } from "@/components/ui";
import { requireAuth } from "@/lib/auth";
import { updateProfileAction } from "./actions";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; tone?: "success" | "error" }>;
}) {
  const auth = await requireAuth();
  const { message, tone } = await searchParams;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Account settings</h1>
            <p className="mt-1 text-sm text-zinc-600">Manage your profile details used across dashboard and draw records.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="neutral">{auth.email ?? "No email"}</Badge>
            <form action={signOutAction}><Button variant="secondary" type="submit">Logout</Button></form>
          </div>
        </div>
      </Card>

      <Card>
        {message ? (
          <p className={`mb-4 rounded-lg px-3 py-2 text-sm ${tone === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
            {message}
          </p>
        ) : null}
        <form action={updateProfileAction} className="space-y-3">
          <label htmlFor="fullName" className="text-sm font-medium text-zinc-700">Full name</label>
          <Input id="fullName" name="fullName" defaultValue={auth.fullName} required />
          <label htmlFor="email" className="text-sm font-medium text-zinc-700">Email</label>
          <Input id="email" type="email" value={auth.email ?? ""} disabled />
          <Button type="submit">Save changes</Button>
        </form>
      </Card>
    </div>
  );
}
