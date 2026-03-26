import { Card, Input, Button } from "@/components/ui";

export default function SettingsPage() {
  return (
    <Card>
      <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-2 text-sm text-zinc-600">Account settings shell.</p>
      <div className="mt-5 grid gap-3">
        <Input placeholder="Display name" />
        <Input type="email" placeholder="Email" />
        <Button className="w-full sm:w-auto" type="button">Save changes</Button>
      </div>
    </Card>
  );
}
