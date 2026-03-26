import { signOutAction } from "@/app/(auth)/actions";
import { Badge, Button, Card, DataTable, Table, Td, Th } from "@/components/ui";
import { requireAuth } from "@/lib/auth";

export default async function DashboardPage() {
  const auth = await requireAuth();

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">User dashboard</h1>
            <p className="mt-1 text-sm text-zinc-600">Signed in as {auth.fullName} ({auth.email ?? "no email"}).</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="success">{auth.role}</Badge>
            <form action={signOutAction}><Button variant="secondary" type="submit">Logout</Button></form>
          </div>
        </div>
      </Card>
      <DataTable>
        <Table>
          <thead className="bg-zinc-50"><tr><Th>Area</Th><Th>Access</Th></tr></thead>
          <tbody className="divide-y divide-zinc-200"><tr><Td>User dashboard</Td><Td>Allowed</Td></tr><tr><Td>Admin panel</Td><Td>{auth.role === "admin" ? "Allowed" : "Restricted"}</Td></tr></tbody>
        </Table>
      </DataTable>
    </div>
  );
}
