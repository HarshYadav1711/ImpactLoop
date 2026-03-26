import Link from "next/link";
import { signUpAction } from "@/app/(auth)/actions";
import { Button, Card, Input } from "@/components/ui";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <Card>
      <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
      <p className="mt-2 text-sm text-zinc-600">Set up your account with email and password.</p>
      {error ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <form action={signUpAction} className="mt-5 space-y-3">
        <Input name="fullName" placeholder="Full name" required />
        <Input name="email" type="email" placeholder="Email" required />
        <Input name="password" type="password" placeholder="Password" minLength={8} required />
        <Button className="w-full" type="submit">Create account</Button>
      </form>
      <p className="mt-4 text-sm text-zinc-600">Already registered? <Link href="/login" className="underline">Sign in</Link></p>
    </Card>
  );
}
