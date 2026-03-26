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
        <Input name="email" type="email" placeholder="Email" required />
        <Input name="password" type="password" placeholder="Password" required />
        <Button className="w-full" type="submit">Continue</Button>
      </form>
      <p className="mt-4 text-sm text-zinc-600">No account? <Link href="/signup" className="underline">Create one</Link></p>
    </Card>
  );
}
