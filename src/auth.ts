import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import { Role, UserStatus } from "@/generated/prisma/enums";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  ...authConfig,
});

export class AuthorizationError extends Error {
  constructor(message = "Not authorized") {
    super(message);
    this.name = "AuthorizationError";
  }
}

// Throws unless there is a signed-in, non-suspended user. 
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new AuthorizationError("You must be signed in");
  if (session.user.status === UserStatus.SUSPENDED) {
    throw new AuthorizationError("Your account is suspended");
  }
  return session.user;
}

// Throws unless the signed-in user is a MODERATOR. 
export async function requireModerator() {
  const user = await requireUser();
  if (user.role !== Role.MODERATOR) {
    throw new AuthorizationError("Moderator access required");
  }
  return user;
}
