import "server-only";
import { prisma } from "@/lib/prisma";
import { AdStatus, UserStatus } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import type { SearchFilters } from "@/lib/validations";

export const PAGE_SIZE = 12;

async function resolveCategoryIds(slug?: string): Promise<string[] | undefined> {
  if (!slug) return undefined;

  const category = await prisma.category.findUnique({
    where: { slug },
    select: { id: true, children: { select: { id: true } } },
  });

  if (!category) return []; 
  return [category.id, ...category.children.map((c) => c.id)];
}

export async function searchAdvertisements(filters: SearchFilters) {
  const categoryIds = await resolveCategoryIds(filters.category);

  const where: Prisma.AdvertisementWhereInput = {
    status: AdStatus.ACTIVE,
    // Hide listings belonging to suspended sellers.
    user: { status: UserStatus.ACTIVE },
    ...(filters.q && {
      OR: [
        { title: { contains: filters.q, mode: "insensitive" } },
        { description: { contains: filters.q, mode: "insensitive" } },
      ],
    }),
    ...(categoryIds && { categoryId: { in: categoryIds } }),
    ...(filters.location && { location: { slug: filters.location } }),
    ...((filters.minPrice !== undefined || filters.maxPrice !== undefined) && {
      price: {
        ...(filters.minPrice !== undefined && { gte: filters.minPrice }),
        ...(filters.maxPrice !== undefined && { lte: filters.maxPrice }),
      },
    }),
  };

  const skip = (filters.page - 1) * PAGE_SIZE;

  const [items, total] = await Promise.all([
    prisma.advertisement.findMany({
      relationLoadStrategy: "join",
      where,
      select: {
        id: true,
        title: true,
        price: true,
        createdAt: true,
        location: { select: { name: true, slug: true } },
        category: { select: { name: true, slug: true } },
        user: { select: { name: true } },
        images: {
          where: { isPrimary: true },
          select: { filePath: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.advertisement.count({ where }),
  ]);

  return {
    items,
    total,
    page: filters.page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export type SearchResult = Awaited<ReturnType<typeof searchAdvertisements>>;
export type AdCardData = SearchResult["items"][number];

//seller's phone number and email are never serialised into the RSC payload for a guest, so it cannot leak by inspecting the page source.
export async function getAdvertisementById(id: string, includeContact: boolean) {
  return prisma.advertisement.findFirst({
    relationLoadStrategy: "join",
    where: { id, status: AdStatus.ACTIVE, user: { status: UserStatus.ACTIVE } },
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      createdAt: true,
      contactPhone: includeContact,
      category: {
        select: { name: true, slug: true, parent: { select: { name: true, slug: true } } },
      },
      location: { select: { name: true, slug: true } },
      user: { select: { name: true, image: true, email: includeContact } },
      images: { select: { filePath: true, isPrimary: true }, orderBy: { isPrimary: "desc" } },
    },
  });
}

// Top-level categories with their children, for nav and the search sidebar. 
export async function getCategoryTree() {
  return prisma.category.findMany({
    relationLoadStrategy: "join",
    where: { parentId: null },
    select: {
      id: true,
      name: true,
      slug: true,
      children: {
        select: { id: true, name: true, slug: true },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getLocations() {
  return prisma.location.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });
}

// The moderator side: pending ads, oldest ads displays first so everything gets attention.
export async function getPendingAdvertisements() {
  return prisma.advertisement.findMany({
    relationLoadStrategy: "join",
    where: { status: AdStatus.PENDING },
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      createdAt: true,
      contactPhone: true,
      user: { select: { name: true, email: true } },
      category: { select: { name: true, parent: { select: { name: true } } } },
      location: { select: { name: true } },
      images: { select: { filePath: true, isPrimary: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

// Everything the signed-in user has posted, in any state.
export async function getMyAdvertisements(userId: string) {
  return prisma.advertisement.findMany({
    relationLoadStrategy: "join",
    where: { userId },
    select: {
      id: true,
      title: true,
      price: true,
      status: true,
      rejectionNote: true,
      createdAt: true,
      category: { select: { name: true } },
      location: { select: { name: true } },
      images: { where: { isPrimary: true }, select: { filePath: true }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });
}
