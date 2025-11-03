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
        };
      },
    }),
  ],
  callbacks: {
    session: async ({ session, token }) => {
      if (session.user && token?.sub) {
        session.user.id = token.sub;
      }

      return session;
    },
    jwt: async ({ token, user }) => {
      if (user) {
        token.sub = user.id;
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

