"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const signUpSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must contain at least 2 characters.")
      .max(120, "Name must be 120 characters or less.")
      .optional()
      .or(z.literal(""))
      .transform((value) => value?.trim() ?? "")
      .optional(),
    email: z
      .string({ message: "Email is required." })
      .min(1, "Email is required.")
      .email({ message: "Enter a valid email address." }),
    password: z
      .string({ message: "Password is required." })
      .min(8, "Password must contain at least 8 characters."),
    confirmPassword: z
      .string({ message: "Confirm your password." })
      .min(8, "Confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"],
  });

type SignUpFormValues = z.infer<typeof signUpSchema>;

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? undefined;

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (values: SignUpFormValues) => {
    setFormError(null);

    startTransition(async () => {
      const payload = {
        name: values.name?.trim() ? values.name.trim() : undefined,
        email: values.email.toLowerCase(),
        password: values.password,
      };

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let message = "Unable to create your account.";

        try {
          const body = await response.json();
          message = body?.error ?? message;
        } catch (error) {
          console.error("[SignUp] failed to parse error", error);
        }

        setFormError(message);
        return;
      }

      const signInResult = await signIn("credentials", {
        redirect: false,
        email: values.email,
        password: values.password,
        callbackUrl: callbackUrl ?? undefined,
      });

      if (signInResult?.error) {
        setFormError("Account created, but we couldn't sign you in automatically. Please log in manually.");
        return;
      }

      router.replace(callbackUrl ?? "/onboarding");
      router.refresh();
    });
  };

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Jane Doe"
                  autoComplete="name"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormDescription>Used to personalize your dashboard (optional).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {formError ? (
          <p className="text-sm font-medium text-destructive" role="alert">
            {formError}
          </p>
        ) : null}

        <Button className="w-full" type="submit" size="lg" disabled={isPending}>
          {isPending ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </Form>
  );
}

