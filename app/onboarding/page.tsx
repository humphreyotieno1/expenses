import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { OnboardingForm } from "@/components/auth/onboarding-form";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AuthSessionProvider } from "@/components/auth/session-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { authOptions } from "@/lib/auth";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.onboarded) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-8 px-4 py-12">
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-semibold">Let’s personalise your workspace</CardTitle>
            <CardDescription>
              A few quick details help tailor insights and reports to you. You can change any of this later from your profile settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AuthSessionProvider session={session}>
              <OnboardingForm />
            </AuthSessionProvider>
          </CardContent>
        </Card>

        <Card className="border-dashed lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle className="text-xl">What happens next?</CardTitle>
            <CardDescription>
              Get the most out of your new tracker in three simple steps.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div>
              <h3 className="font-medium text-foreground">1. Add your first transaction</h3>
              <p>Capture a recent expense or income to start building your timeline.</p>
            </div>
            <div>
              <h3 className="font-medium text-foreground">2. Categorise your spending</h3>
              <p>Use consistent categories to unlock richer insights and reports.</p>
            </div>
            <div>
              <h3 className="font-medium text-foreground">3. Revisit weekly</h3>
              <p>Check the dashboard regularly to stay on top of cashflow trends.</p>
            </div>
          </CardContent>
          <Separator className="mx-6" />
          <CardFooter className="flex flex-col items-start gap-3 px-6 py-6 text-sm text-muted-foreground">
            <p>
              Prefer to finish later? You can always manage your profile and onboarding from the dashboard menu.
            </p>
            <div className="flex items-center gap-3 text-xs">
              <Link
                href="/login"
                className="text-primary underline-offset-4 hover:underline"
              >
                Switch account
              </Link>
              <span className="text-border">•</span>
              <SignOutButton />
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

