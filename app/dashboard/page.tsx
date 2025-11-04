import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.onboarded) {
    redirect("/onboarding");
  }

  const displayName = session.user.name ?? session.user.email ?? "there";

  return <DashboardShell displayName={displayName} />;
}

