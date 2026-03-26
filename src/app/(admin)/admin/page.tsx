import { Card, Dialog } from "@/components/ui";
import { ErrorState } from "@/components/state";

export default function AdminPage() {
  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-xl font-semibold tracking-tight">Admin workspace</h1>
        <p className="mt-2 text-sm text-zinc-600">Admin route shell with staged controls and operational guardrails.</p>
      </Card>
      <ErrorState title="No admin data source connected" message="Attach admin queries and role checks in the implementation phase." />
      <Dialog open title="Confirmation pattern" description="Reusable modal primitive for irreversible admin actions.">
        <p className="text-sm text-zinc-700">Modal body placeholder.</p>
      </Dialog>
    </div>
  );
}
