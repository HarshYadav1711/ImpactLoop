import Link from "next/link";
import { Button, Card, Input } from "@/components/ui";

export default function LoginPage() {
  return (
    <Card>
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-zinc-600">Auth route shell prepared for Supabase login integration.</p>
      <form className="mt-5 space-y-3">
        <Input type="email" placeholder="Email" />
        <Input type="password" placeholder="Password" />
        <Button className="w-full" type="button">Continue</Button>
      </form>
      <p className="mt-4 text-sm text-zinc-600">No account? <Link href="/signup" className="underline">Create one</Link></p>
    </Card>
  );
}
