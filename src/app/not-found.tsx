import Link from "next/link";
import { Button, Card } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
      <Card className="w-full text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-2 text-sm text-zinc-600">The route does not exist in this app structure.</p>
        <Link href="/" className="mt-5 inline-block"><Button>Return home</Button></Link>
      </Card>
    </main>
  );
}
