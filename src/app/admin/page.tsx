import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPendingAdvertisements } from "@/lib/queries";
import { formatPrice, formatDate } from "@/lib/format";
import { ModerationCard } from "@/components/moderation-card";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin?callbackUrl=/admin");
  if (session.user.role !== "MODERATOR") redirect("/forbidden");

  const pending = await getPendingAdvertisements();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Moderation queue</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {pending.length} {pending.length === 1 ? "ad is" : "ads are"} waiting for review, oldest first.
      </p>

      {pending.length === 0 ? (
        <p className="mt-8 rounded-lg border bg-background p-12 text-center text-muted-foreground">
          Nothing to review. Good work.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {pending.map((ad) => (
            <ModerationCard
              key={ad.id}
              ad={{
                id: ad.id,
                title: ad.title,
                description: ad.description,
                price: formatPrice(ad.price),
                createdAt: formatDate(ad.createdAt),
                contactPhone: ad.contactPhone,
                seller: ad.user.name ?? "Unknown seller",
                sellerEmail: ad.user.email,
                category: ad.category.parent
                  ? `${ad.category.parent.name} › ${ad.category.name}`
                  : ad.category.name,
                location: ad.location.name,
                images: ad.images.map((image) => ({ filePath: image.filePath })),
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
