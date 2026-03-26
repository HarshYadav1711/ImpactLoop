import { Card, DataTable, EmptyState, Table, Td, Th } from "@/components/ui";
import { LoadingState } from "@/components/state";

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-sm text-zinc-600">User area shell with production-ready component patterns.</p>
      </Card>
      <LoadingState label="Loading user metrics layout..." />
      <DataTable>
        <Table>
          <thead className="bg-zinc-50"><tr><Th>Section</Th><Th>Status</Th></tr></thead>
          <tbody className="divide-y divide-zinc-200"><tr><Td>Subscription</Td><Td>Planned</Td></tr><tr><Td>Scores</Td><Td>Planned</Td></tr></tbody>
        </Table>
      </DataTable>
      <EmptyState title="No records connected" description="Link dashboard queries when Supabase data flow is implemented." actionLabel="Connect data" />
    </div>
  );
}
