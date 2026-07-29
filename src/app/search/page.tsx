import Link from "next/link";
import { getCategoryTree, getLocations, searchAdvertisements } from "@/lib/queries";
import { searchParamsSchema } from "@/lib/validations";
import { AdCard } from "@/components/ad-card";
import { SearchFiltersForm } from "@/components/search-filters";
import { buttonVariants } from "@/components/ui/button";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SearchPage({ searchParams }: Props) {
  const raw = await searchParams;
  const filters = searchParamsSchema.parse(raw);

  const [categories, locations, results] = await Promise.all([
    getCategoryTree(),
    getLocations(),
    searchAdvertisements(filters),
  ]);

  const pageLink = (page: number) => {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.category) params.set("category", filters.category);
    if (filters.location) params.set("location", filters.location);
    if (filters.minPrice !== undefined) params.set("minPrice", String(filters.minPrice));
    if (filters.maxPrice !== undefined) params.set("maxPrice", String(filters.maxPrice));
    params.set("page", String(page));
    return `/search?${params}`;
  };

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside>
          <SearchFiltersForm categories={categories} locations={locations} filters={filters} />
        </aside>

        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h1 className="text-xl font-semibold">
              {results.total} {results.total === 1 ? "listing" : "listings"}
            </h1>
            {results.pageCount > 1 && (
              <p className="text-sm text-muted-foreground">
                Page {results.page} of {results.pageCount}
              </p>
            )}
          </div>

          {results.items.length === 0 ? (
            <div className="rounded-lg border bg-background p-12 text-center">
              <p className="font-medium">No listings match your filters</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try widening your price range or clearing the keyword.
              </p>
              <Link
                href="/search"
                className={buttonVariants({ variant: "outline", className: "mt-4" })}
              >
                Clear filters
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {results.items.map((ad) => (
                <AdCard key={ad.id} {...ad} />
              ))}
            </div>
          )}

          {results.pageCount > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              {results.page > 1 && (
                <Link
                  href={pageLink(results.page - 1)}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Previous
                </Link>
              )}
              {results.page < results.pageCount && (
                <Link
                  href={pageLink(results.page + 1)}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
