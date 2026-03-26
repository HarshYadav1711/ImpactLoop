import Link from "next/link";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/admin" className="font-semibold tracking-tight">ImpactLoop Admin</Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/admin" className="rounded-md px-3 py-1.5 text-zinc-700 hover:bg-zinc-100">Dashboard</Link>
            <Link href="/admin/users" className="rounded-md px-3 py-1.5 text-zinc-700 hover:bg-zinc-100">Users</Link>
            <Link href="/dashboard" className="rounded-md px-3 py-1.5 text-zinc-700 hover:bg-zinc-100">Back to app</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
