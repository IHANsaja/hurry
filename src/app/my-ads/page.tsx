import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getMyAdvertisements } from "@/lib/queries";
import { formatPrice, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const statusVariant = {
  PENDING: "secondary",
  ACTIVE: "default",
  REJECTED: "destructive",
} as const;

const statusLabel = {
  PENDING: "Awaiting review",
  ACTIVE: "Live",
  REJECTED: "Rejected",
};

type Props = { searchParams: Promise<{ posted?: string }> };

export default async function MyAdsPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/signin?callbackUrl=/my-ads");

  const { posted } = await searchParams;
  const ads = await getMyAdvertisements(session.user.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My advertisements</h1>
        <Link href="/post" className={buttonVariants({ size: "sm" })}>
          Post an ad
        </Link>
      </div>

      {posted && (
        <Alert className="mt-4">
          <AlertTitle>Submitted for review</AlertTitle>
          <AlertDescription>
            A moderator will review your ad shortly. You will get an email once it is decided.
          </AlertDescription>
        </Alert>
      )}

      {ads.length === 0 ? (
        <p className="mt-8 rounded-lg border bg-background p-12 text-center text-muted-foreground">
          You have not posted anything yet.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {ads.map((ad) => (
            <li key={ad.id} className="rounded-lg border bg-background p-4">
              <div className="flex gap-4">
                <div className="relative size-24 shrink-0 overflow-hidden rounded-md bg-muted">
                  {ad.images[0] && (
                    <Image src={ad.images[0].filePath} alt="" fill sizes="96px" className="object-cover" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="truncate font-medium">{ad.title}</h2>
                    <Badge variant={statusVariant[ad.status]}>{statusLabel[ad.status]}</Badge>
                  </div>
                  <p className="mt-1 font-semibold">{formatPrice(ad.price)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {ad.category.name} · {ad.location.name} · {formatDate(ad.createdAt)}
                  </p>

                  {ad.status === "REJECTED" && ad.rejectionNote && (
                    <Alert variant="destructive" className="mt-3">
                      <AlertTitle>Moderator note</AlertTitle>
                      <AlertDescription>{ad.rejectionNote}</AlertDescription>
                    </Alert>
                  )}

                  {ad.status === "ACTIVE" && (
                    <Link
                      href={`/ads/${ad.id}`}
                      className={buttonVariants({
                        variant: "link",
                        size: "sm",
                        className: "mt-1 h-auto p-0",
                      })}
                    >
                      View listing
                    </Link>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
