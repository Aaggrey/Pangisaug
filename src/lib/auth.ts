import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/types";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider && account.provider !== "credentials" && user.email) {
        const email = user.email.toLowerCase();
        let dbUser = await prisma.user.findUnique({ where: { email } });
        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              name: user.name ?? email.split("@")[0],
              email,
              passwordHash: await bcrypt.hash(randomUUID(), 10),
              role: "USER",
              avatar: user.image || null,
            },
          });
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        const isOAuth = account?.provider && account.provider !== "credentials";
        if (isOAuth && user.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email.toLowerCase() },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.avatar = dbUser.avatar ?? user.image ?? null;
          }
        } else {
          token.id = user.id;
          token.role = (user as SessionUser).role;
          token.avatar = (user as SessionUser).avatar;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "USER";
        session.user.avatar = (token.avatar as string) ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  const u = session.user as SessionUser;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role ?? "USER",
    avatar: u.avatar ?? null,
  };
}

export function requireRole(roles: string[]) {
  return async () => {
    const user = await getSessionUser();
    if (!user) return null;
    if (!roles.includes(user.role)) return null;
    return user;
  };
}