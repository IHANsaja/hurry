import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { formatPrice, timeAgo } from "@/lib/format";

type Props = {
  id: string;
  title: string;
  price: { toString(): string };
  createdAt: Date;
  category: { name: string };
  location: { name: string };
  images: { filePath: string }[];
};

export function AdCard({ id, title, price, createdAt, category, location, images }: Props) {
  const image = images[0]?.filePath;

  return (
    <Link
      href={`/ads/${id}`}
      className="group flex flex-col overflow-hidden rounded-lg border bg-background transition hover:shadow-md"
    >
      <div className="relative aspect-[3/2] bg-muted">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No photo
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 font-medium leading-snug">{title}</h3>
        <p className="text-lg font-semibold">{formatPrice(price)}</p>
        <div className="mt-auto flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">{category.name}</Badge>
          <span>{location.name}</span>
          <span aria-hidden>·</span>
          <span>{timeAgo(createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
