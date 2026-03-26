import Link from "next/link";
import { Button, Card, Input } from "@/components/ui";

export default function SignupPage() {
  return (
    <Card>
      <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
      <p className="mt-2 text-sm text-zinc-600">Auth route shell prepared for Supabase signup integration.</p>
      <form className="mt-5 space-y-3">
        <Input placeholder="Full name" />
        <Input type="email" placeholder="Email" />
        <Input type="password" placeholder="Password" />
        <Button className="w-full" type="button">Create account</Button>
      </form>
      <p className="mt-4 text-sm text-zinc-600">Already registered? <Link href="/login" className="underline">Sign in</Link></p>
    </Card>
  );
}
