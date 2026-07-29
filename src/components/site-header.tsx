import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="border-b bg-background sticky top-0 z-40">
      <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Hurry
        </Link>

        <nav className="ml-auto flex items-center gap-2">
          <Link href="/search" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Browse
          </Link>

          {user?.role === "MODERATOR" && (
            <Link href="/admin" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Moderation
            </Link>
          )}

          {user ? (
            <>
              <Link href="/my-ads" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                My ads
              </Link>
              <Link href="/post" className={buttonVariants({ size: "sm" })}>
                Post an ad
              </Link>
              <Avatar className="size-8">
                {user.image && <AvatarImage src={user.image} alt="" />}
                <AvatarFallback>{user.name?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
              </Avatar>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <Button variant="ghost" size="sm" type="submit">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <Link href="/signin" className={buttonVariants({ size: "sm" })}>
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
