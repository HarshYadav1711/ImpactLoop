import Link from "next/link";

export function DashboardShell({
  children,
  canAccessAdmin = false,
}: {
  children: React.ReactNode;
  canAccessAdmin?: boolean;
}) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/dashboard" className="font-semibold tracking-tight">ImpactLoop</Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/dashboard" className="rounded-md px-3 py-1.5 text-zinc-700 hover:bg-zinc-100">Overview</Link>
            <Link href="/settings" className="rounded-md px-3 py-1.5 text-zinc-700 hover:bg-zinc-100">Settings</Link>
            {canAccessAdmin ? <Link href="/admin" className="rounded-md px-3 py-1.5 text-zinc-700 hover:bg-zinc-100">Admin</Link> : null}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
