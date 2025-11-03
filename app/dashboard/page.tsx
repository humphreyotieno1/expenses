import { getServerSession } from "next-auth";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const displayName = session?.user?.name ?? session?.user?.email ?? "there";

  return <DashboardShell displayName={displayName} />;
}

