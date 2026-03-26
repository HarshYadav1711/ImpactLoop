import { forgotPasswordAction } from "@/app/(auth)/forgot-password/actions";
import { Button, Card, Input } from "@/components/ui";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; tone?: "success" | "error" }>;
}) {
  const { message, tone } = await searchParams;

  return (
    <Card>
      <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
      <p className="mt-2 text-sm text-zinc-600">Enter your account email and we will send reset instructions.</p>
      {message ? (
        <p className={`mt-3 rounded-lg px-3 py-2 text-sm ${tone === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          {message}
        </p>
      ) : null}
      <form action={forgotPasswordAction} className="mt-5 space-y-3">
        <label htmlFor="forgotEmail" className="text-sm font-medium text-zinc-700">Email address</label>
        <Input id="forgotEmail" name="email" type="email" placeholder="you@example.com" required />
        <Button className="w-full" type="submit">Send reset link</Button>
      </form>
    </Card>
  );
}
