import Link from "next/link";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="font-semibold tracking-tight text-zinc-900">ImpactLoop</Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/pricing" className="rounded-lg px-3 py-2 text-zinc-600 hover:bg-zinc-100">Pricing</Link>
            <Link href="/login" className="rounded-lg px-3 py-2 text-zinc-700 hover:bg-zinc-100">Sign in</Link>
            <Link href="/signup" className="rounded-lg bg-zinc-900 px-3 py-2 font-medium text-white">Get started</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
