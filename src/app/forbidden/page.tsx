import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">Access denied</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This area is limited to moderators. If you think this is a mistake, contact an administrator.
      </p>
      <Link href="/" className={buttonVariants({ className: "mt-6" })}>
        Back to listings
      </Link>
    </div>
  );
}
