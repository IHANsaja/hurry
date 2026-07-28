import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        That listing may have been removed or is awaiting moderation.
      </p>
      <Link href="/search" className={buttonVariants({ className: "mt-6" })}>
        Browse listings
      </Link>
    </div>
  );
}
