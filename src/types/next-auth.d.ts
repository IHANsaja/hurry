import type { DefaultSession } from "next-auth";
import type { Role, UserStatus } from "@/generated/prisma/enums";

// Teach TypeScript about the extra fields we put on the session/token in
// src/auth.config.ts, so `session.user.role` is typed everywhere.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      status: UserStatus;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    status: UserStatus;
  }
}

// NOTE: augment "@auth/core/jwt", NOT "next-auth/jwt".
// `next-auth/jwt` is only `export * from "@auth/core/jwt"` — a re-export.
// Declaring a module that re-exports creates a *separate* declaration instead
// of merging into the real `JWT` interface, so the extra fields are silently
// ignored and `token.role` falls back to the `Record<string, unknown>` index
// signature (hence "Type 'unknown' is not assignable to type 'Role'").
declare module "@auth/core/jwt" {
  interface JWT {
    role: Role;
    status: UserStatus;
  }
}
