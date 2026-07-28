import Link from "next/link";
import { getCategoryTree, searchAdvertisements } from "@/lib/queries";
import { AdCard } from "@/components/ad-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function HomePage() {
  const [categories, recent] = await Promise.all([
    getCategoryTree(),
    searchAdvertisements({ page: 1 }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-10">
      <section className="rounded-xl border bg-background p-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Find what you need, nearby</h1>
        <p className="mt-2 text-muted-foreground">
          Thousands of listings across vehicles, electronics, property and more.
        </p>
        <form action="/search" className="mx-auto mt-6 flex max-w-lg gap-2">
          <Input name="q" placeholder="What are you looking for?" aria-label="Search" />
          <Button type="submit">Search</Button>
        </form>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Browse categories</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((parent) => (
            <div key={parent.id} className="rounded-lg border bg-background p-4">
              <Link href={`/search?category=${parent.slug}`} className="font-medium hover:underline">
                {parent.name}
              </Link>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {parent.children.map((child) => (
                  <li key={child.id}>
                    <Link href={`/search?category=${child.slug}`} className="hover:text-foreground">
                      {child.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent listings</h2>
          <Link href="/search" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            View all
          </Link>
        </div>

        {recent.items.length === 0 ? (
          <p className="rounded-lg border bg-background p-8 text-center text-muted-foreground">
            No listings yet. Be the first to post one.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recent.items.map((ad) => (
              <AdCard key={ad.id} {...ad} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
