import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCategoryTree, getLocations } from "@/lib/queries";
import { AdForm } from "@/components/ad-form";

export default async function PostAdPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin?callbackUrl=/post");

  const [categories, locations] = await Promise.all([getCategoryTree(), getLocations()]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Post an advertisement</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Give buyers as much detail as you can — listings with photos sell faster.
      </p>

      <div className="mt-6 rounded-lg border bg-background p-6">
        <AdForm categories={categories} locations={locations} />
      </div>
    </div>
  );
}
