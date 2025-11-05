import type { DefaultSession } from "next-auth";
import type { SupportedCurrency } from "@/lib/currency";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      onboarded?: boolean;
      currency?: SupportedCurrency;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    onboarded?: boolean;
    currency?: SupportedCurrency;
  }
}

