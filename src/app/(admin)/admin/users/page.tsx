import { Badge, Card, DataTable, Table, Td, Th } from "@/components/ui";

export default function AdminUsersPage() {
  return (
    <Card>
      <h1 className="text-xl font-semibold tracking-tight">Users</h1>
      <p className="mt-2 text-sm text-zinc-600">Administrative user list shell.</p>
      <div className="mt-4">
        <DataTable>
          <Table>
            <thead className="bg-zinc-50"><tr><Th>Name</Th><Th>Role</Th><Th>Status</Th></tr></thead>
            <tbody className="divide-y divide-zinc-200">
              <tr><Td>Sample User</Td><Td><Badge>user</Badge></Td><Td>Placeholder</Td></tr>
              <tr><Td>Sample Admin</Td><Td><Badge tone="warning">admin</Badge></Td><Td>Placeholder</Td></tr>
            </tbody>
          </Table>
        </DataTable>
      </div>
    </Card>
  );
}
