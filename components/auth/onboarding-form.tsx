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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supportedCurrencies, type SupportedCurrency } from "@/lib/currency";

const onboardingSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must contain at least 2 characters.")
    .max(120, "Name must be 120 characters or less."),
  currency: z.enum(supportedCurrencies.map((currency) => currency.value) as [SupportedCurrency, ...SupportedCurrency[]]),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export function OnboardingForm() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const defaultName = session?.user?.name ?? "";
  const defaultCurrency = session?.user?.currency ?? "USD";

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: defaultName,
      currency: defaultCurrency as SupportedCurrency,
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
          name: values.name,
          onboarded: true,
          currency: values.currency,
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
          name: values.name,
          onboarded: true,
          currency: values.currency,
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

        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default currency</FormLabel>
              <FormControl>
                <Select
                  disabled={isPending}
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedCurrencies.map((currencyOption) => (
                      <SelectItem key={currencyOption.value} value={currencyOption.value}>
                        {currencyOption.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>Choose the currency you use most often when tracking transactions.</FormDescription>
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

