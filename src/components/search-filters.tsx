import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SearchFilters as Filters } from "@/lib/validations";

type Category = {
  id: string;
  name: string;
  slug: string;
  children: { id: string; name: string; slug: string }[];
};

type Props = {
  categories: Category[];
  locations: { id: string; name: string; slug: string }[];
  filters: Filters;
};

const selectClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function SearchFiltersForm({ categories, locations, filters }: Props) {
  return (
    <form action="/search" className="space-y-4 rounded-lg border bg-background p-4">
      <div className="space-y-1.5">
        <Label htmlFor="q">Keyword</Label>
        <Input id="q" name="q" defaultValue={filters.q ?? ""} placeholder="e.g. Toyota Aqua" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category">Category</Label>
        <select id="category" name="category" defaultValue={filters.category ?? ""} className={selectClass}>
          <option value="">All categories</option>
          {categories.map((parent) => (
            <optgroup key={parent.id} label={parent.name}>
              <option value={parent.slug}>All {parent.name}</option>
              {parent.children.map((child) => (
                <option key={child.id} value={child.slug}>
                  {child.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="location">Location</Label>
        <select id="location" name="location" defaultValue={filters.location ?? ""} className={selectClass}>
          <option value="">All locations</option>
          {locations.map((location) => (
            <option key={location.id} value={location.slug}>
              {location.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="minPrice">Min price</Label>
          <Input
            id="minPrice"
            name="minPrice"
            type="number"
            min={0}
            defaultValue={filters.minPrice ?? ""}
            placeholder="0"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="maxPrice">Max price</Label>
          <Input
            id="maxPrice"
            name="maxPrice"
            type="number"
            min={0}
            defaultValue={filters.maxPrice ?? ""}
            placeholder="Any"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          Apply filters
        </Button>
        <a href="/search" className={buttonVariants({ variant: "outline" })}>
          Reset
        </a>
      </div>
    </form>
  );
}
