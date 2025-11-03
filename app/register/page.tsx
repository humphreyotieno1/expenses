import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-12 text-center">
      <div className="max-w-md space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Create an account</h1>
        <p className="text-sm text-muted-foreground">
          Account creation and onboarding flows are coming soon. In the meantime,
          reach out to the project maintainer to request access.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-md border bg-background px-4 py-2 text-sm font-semibold shadow-sm transition-colors hover:bg-muted"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

