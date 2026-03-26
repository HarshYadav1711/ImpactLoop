import { Button, Card, Input } from "@/components/ui";

export default function ForgotPasswordPage() {
  return (
    <Card>
      <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
      <p className="mt-2 text-sm text-zinc-600">Password reset route shell.</p>
      <form className="mt-5 space-y-3">
        <Input type="email" placeholder="Email" />
        <Button className="w-full" type="button">Send reset link</Button>
      </form>
    </Card>
  );
}
