import { DashboardShell } from "@/components/layout";
import { requireAuth } from "@/lib/auth";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireAuth();
  return <DashboardShell canAccessAdmin={auth.role === "admin"}>{children}</DashboardShell>;
}
