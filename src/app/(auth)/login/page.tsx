import Link from "next/link";
import { signInAction } from "@/app/(auth)/actions";
import { Button, Card, Input } from "@/components/ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <Card>
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-zinc-600">Use your account to access ImpactLoop.</p>
      {error ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <form action={signInAction} className="mt-5 space-y-3">
        <label htmlFor="loginEmail" className="text-sm font-medium text-zinc-700">Email</label>
        <Input id="loginEmail" name="email" type="email" placeholder="Email" required />
        <label htmlFor="loginPassword" className="text-sm font-medium text-zinc-700">Password</label>
        <Input id="loginPassword" name="password" type="password" placeholder="Password" required />
        <Button className="w-full" type="submit">Continue</Button>
      </form>
      <div className="mt-4 flex items-center justify-between gap-3 text-sm text-zinc-600">
        <p>No account? <Link href="/signup" className="underline">Create one</Link></p>
        <Link href="/forgot-password" className="underline">Forgot password</Link>
      </div>
    </Card>
  );
}
