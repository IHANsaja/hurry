import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getAdvertisementById } from "@/lib/queries";
import { formatPrice, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type Props = { params: Promise<{ id: string }> };

export default async function AdDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const signedIn = Boolean(session?.user);

  const ad = await getAdvertisementById(id, signedIn);
  if (!ad) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Link href="/search" className="hover:text-foreground">
          All listings
        </Link>
        {ad.category.parent && (
          <>
            <span>/</span>
            <Link href={`/search?category=${ad.category.parent.slug}`} className="hover:text-foreground">
              {ad.category.parent.name}
            </Link>
          </>
        )}
        <span>/</span>
        <Link href={`/search?category=${ad.category.slug}`} className="hover:text-foreground">
          {ad.category.name}
        </Link>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="relative aspect-[3/2] overflow-hidden rounded-lg border bg-muted">
            {ad.images[0] ? (
              <Image
                src={ad.images[0].filePath}
                alt={ad.title}
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No photo
              </div>
            )}
          </div>

          {ad.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {ad.images.slice(1).map((image, index) => (
                <div key={index} className="relative aspect-square overflow-hidden rounded-md border">
                  <Image
                    src={image.filePath}
                    alt=""
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="rounded-lg border bg-background p-6">
            <h2 className="mb-2 font-semibold">Description</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {ad.description}
            </p>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border bg-background p-6">
            <h1 className="text-xl font-semibold leading-snug">{ad.title}</h1>
            <p className="mt-2 text-2xl font-bold">{formatPrice(ad.price)}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="secondary">{ad.category.name}</Badge>
              <Badge variant="outline">{ad.location.name}</Badge>
            </div>

            <Separator className="my-4" />

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Posted</dt>
                <dd>{formatDate(ad.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Seller</dt>
                <dd>{ad.user.name ?? "Private seller"}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border bg-background p-6">
            <h2 className="mb-3 font-semibold">Contact seller</h2>
            {signedIn ? (
              <div className="space-y-2 text-sm">
                <p className="font-medium">{ad.contactPhone}</p>
                {ad.user.email && <p className="text-muted-foreground">{ad.user.email}</p>}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Sign in to see this seller&apos;s phone number and email.
                </p>
                <Link
                  href={`/signin?callbackUrl=/ads/${ad.id}`}
                  className={buttonVariants({ className: "w-full" })}
                >
                  Sign in to view
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
