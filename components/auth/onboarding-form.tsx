"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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

const onboardingSchema = z.object({
  name: z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value.length === 0 || value.length >= 2, {
      message: "Name must contain at least 2 characters.",
    })
    .refine((value) => value.length <= 120, {
      message: "Please keep your name under 120 characters.",
    }),
});

type OnboardingFormValues = z.output<typeof onboardingSchema>;

export function OnboardingForm() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const defaultName = session?.user?.name ?? "";

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: defaultName,
    },
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (values: OnboardingFormValues) => {
    setFormError(null);

    startTransition(async () => {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name ? values.name : undefined,
          onboarded: true,
        }),
      });

      if (!response.ok) {
        let message = "We couldn't save your preferences. Please try again.";

        try {
          const body = await response.json();
          message = body?.error ?? message;
        } catch (error) {
          console.error("[Onboarding] failed to parse error", error);
        }

        setFormError(message);
        return;
      }

      await update({
        user: {
          ...(session?.user ?? {}),
          name: values.name ? values.name : session?.user?.name ?? null,
          onboarded: true,
        },
      });

      router.replace("/dashboard");
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
              <FormLabel>What should we call you?</FormLabel>
              <FormControl>
                <Input
                  placeholder="Your name"
                  autoComplete="name"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                This helps personalise reports and summaries. You can change it later.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {formError ? (
          <p className="text-sm font-medium text-destructive" role="alert">
            {formError}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={isPending}>
          {isPending ? "Finishing setup..." : "Finish setup"}
        </Button>
      </form>
    </Form>
  );
}

