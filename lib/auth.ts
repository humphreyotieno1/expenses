import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user?.passwordHash) {
          return null;
        }

        const isValid = await compare(credentials.password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          onboarded: user.onboarded,
        };
      },
    }),
  ],
  callbacks: {
    session: async ({ session, token }) => {
      if (session.user && token?.sub) {
        session.user.id = token.sub;
      }

      if (session.user && typeof token.onboarded !== "undefined") {
        session.user.onboarded = Boolean(token.onboarded);
      }

      if (session.user && typeof token.name === "string") {
        session.user.name = token.name;
      }

      return session;
    },
    jwt: async ({ token, user, trigger, session }) => {
      if (user) {
        token.sub = user.id;
        token.name = user.name ?? token.name;
        token.onboarded = (user as { onboarded?: boolean }).onboarded ?? false;
      } else if (trigger === "update" && session?.user) {
        if (typeof session.user.name !== "undefined") {
          token.name = session.user.name ?? null;
        }
        if (typeof session.user.onboarded !== "undefined") {
          token.onboarded = session.user.onboarded;
        }
      } else if (token.sub && typeof token.onboarded === "undefined") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { onboarded: true, name: true },
        });

        if (dbUser) {
          token.onboarded = dbUser.onboarded;
          token.name = dbUser.name ?? token.name;
        }
      }

      return token;
    },
    redirect: async ({ url, baseUrl }) => {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      if (new URL(url).origin === baseUrl) {
        return url;
      }

      return baseUrl;
    },
  },
  events: {
    async createUser({ user }) {
      if (user.email) {
        const normalizedEmail = user.email.toLowerCase();

        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { email: normalizedEmail },
          });
        } catch (error) {
          console.error("[NextAuth][createUser] failed to normalize email", error);
        }
      }
    },
  },
  logger: {
    error(code, metadata) {
      console.error("[NextAuth][error]", code, metadata);
    },
  },
  debug: process.env.NODE_ENV === "development",
};

