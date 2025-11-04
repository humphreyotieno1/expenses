import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      onboarded?: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    onboarded?: boolean;
  }
}

