import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  session: {
    // JWT sessions keep the proxy check to a cookie read — no DB round trip on
    // every navigation. The role is copied into the token at sign-in below.
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      // `user` is only present on the sign-in pass.
      if (user) {
        token.role = user.role;
        token.status = user.status;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role;
        session.user.status = token.status;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
