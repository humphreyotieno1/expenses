import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { authOptions } from "@/lib/auth";
import type { SupportedCurrency } from "@/lib/currency";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.onboarded) {
    redirect("/onboarding");
  }

  const displayName = session.user.name ?? session.user.email ?? "there";
  const currency = (session.user.currency ?? "USD") as SupportedCurrency;

  return <DashboardShell displayName={displayName} currency={currency} />;
}

