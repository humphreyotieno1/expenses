import Link from "next/link";
import { getServerSession } from "next-auth";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { authOptions } from "@/lib/auth";

const steps = [
  {
    title: "Create your account",
    description: "Sign up with your email address and choose a secure password.",
  },
  {
    title: "Finish onboarding",
    description: "Tell us what to call you and learn how to categorize your expenses.",
  },
  {
    title: "Log every transaction",
    description: "Add income and expenses, apply categories, and keep your balance up to date.",
  },
  {
    title: "Review insights",
    description: "Use the dashboard charts to understand where your money is going each week and month.",
  },
];

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  const primaryCta = session?.user
    ? { href: "/dashboard", label: "Go to dashboard" }
    : { href: "/register", label: "Create an account" };

  const secondaryCta = session?.user
    ? { href: "/onboarding", label: "Finish onboarding" }
    : { href: "/login", label: "Sign in" };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-16 px-4 py-16">
      <section className="grid gap-10 text-center lg:grid-cols-[1.1fr_0.9fr] lg:text-left">
        <div className="space-y-6">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-primary">
            Welcome to Personal Expense Tracker
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Take control of your spending with clarity and confidence
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Log income and expenses in seconds, categorize every transaction, and visualise your progress in a real-time dashboard that travels with you on any device.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Button asChild size="lg">
              <Link href={primaryCta.href}>{primaryCta.label}</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
            </Button>
          </div>
          <Separator className="hidden lg:block" />
          <div className="grid gap-4 text-left text-sm text-muted-foreground sm:grid-cols-2">
            <div>
              <p className="font-medium text-foreground">Fast data entry</p>
              <p>Use streamlined forms and keyboard-friendly shortcuts to record spending in seconds.</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Actionable analytics</p>
              <p>Review category breakdowns and monthly trends to spot overspending early.</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Secure by design</p>
              <p>Your data is stored in a secure Postgres database and protected behind authenticated routes.</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Mobile ready</p>
              <p>
                Responsive layouts keep the dashboard at your fingertips whether you&apos;re on desktop or on the go.
              </p>
            </div>
          </div>
        </div>
        <Card className="my-auto shadow-lg">
          <CardHeader>
            <CardTitle>Getting started is simple</CardTitle>
            <CardDescription>Follow these steps to move from signup to insights in minutes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ol className="space-y-4 text-left">
              {steps.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-foreground">{step.title}</p>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
            {!session?.user ? (
              <p className="rounded-md bg-muted/60 p-4 text-sm text-muted-foreground">
                Already using the tracker? <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">Sign back in</Link> to pick up where you left off.
              </p>
            ) : (
              <p className="rounded-md bg-muted/60 p-4 text-sm text-muted-foreground">
                Need a refresher? Visit your <Link href="/dashboard" className="font-medium text-primary underline-offset-4 hover:underline">dashboard</Link> to review balances, or open the <Link href="/onboarding" className="font-medium text-primary underline-offset-4 hover:underline">onboarding guide</Link> for tips.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[
          {
            title: "Always in sync",
            description: "Data lives in Neon Postgres with Prisma. No matter the device, you see the latest numbers instantly.",
          },
          {
            title: "Smart filters",
            description: "Slice transactions by category, type, or date range to answer budgeting questions fast.",
          },
          {
            title: "Insightful charts",
            description: "Visualise monthly cashflow and spending categories with interactive charts on desktop and mobile.",
          },
        ].map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <CardTitle className="text-lg">{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
