import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { SignInForm } from "@/components/auth/sign-in-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { authOptions } from "@/lib/auth";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect(session.user.onboarded ? "/dashboard" : "/onboarding");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Welcome back</CardTitle>
          <CardDescription>
            Sign in to manage your expenses and stay in control of your budget.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <SignInForm />

          <div className="space-y-4 text-center text-sm text-muted-foreground">
            <Separator />
            <p>
              Don&apos;t have an account yet?{" "}
              <Link
                href="/register"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Create one
              </Link>
            </p>
            <p className="text-xs">
              By signing in, you agree to our{" "}
              <Link
                href="#"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="#"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

