import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  session: { strategy: "jwt" as const },
  pages: { signIn: "/login" },
  providers: [],
} satisfies NextAuthConfig
