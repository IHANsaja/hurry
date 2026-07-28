"use server";

import { randomUUID } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createAdSchema, adImageSchema } from "@/lib/validations";

export type AdFormState = {
  errors?: Record<string, string[]>;
  message?: string;
};

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

async function saveImages(files: File[]) {
  await mkdir(UPLOAD_DIR, { recursive: true });

  const saved: string[] = [];
  for (const file of files) {
    const name = `${randomUUID()}${path.extname(file.name) || ".jpg"}`;
    await writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
    saved.push(`/uploads/${name}`);
  }
  return saved;
}

export async function createAd(
  _prev: AdFormState,
  formData: FormData,
): Promise<AdFormState> {
  const user = await requireUser();

  const parsed = createAdSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    price: formData.get("price"),
    contactPhone: formData.get("contactPhone"),
    categoryId: formData.get("categoryId"),
    locationId: formData.get("locationId"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors, message: "Please fix the errors below." };
  }

  const uploads = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);

  if (uploads.length > 5) {
    return { errors: { images: ["You can upload at most 5 images."] } };
  }

  for (const file of uploads) {
    const image = adImageSchema.safeParse(file);
    if (!image.success) {
      return { errors: { images: image.error.issues.map((i) => i.message) } };
    }
  }

  const [category, location] = await Promise.all([
    prisma.category.findUnique({ where: { id: parsed.data.categoryId }, select: { id: true } }),
    prisma.location.findUnique({ where: { id: parsed.data.locationId }, select: { id: true } }),
  ]);

  if (!category) return { errors: { categoryId: ["That category no longer exists."] } };
  if (!location) return { errors: { locationId: ["That location no longer exists."] } };

  const filePaths = await saveImages(uploads);

  await prisma.advertisement.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      price: parsed.data.price,
      contactPhone: parsed.data.contactPhone,
      categoryId: parsed.data.categoryId,
      locationId: parsed.data.locationId,
      userId: user.id,
      images: {
        create: filePaths.map((filePath, index) => ({ filePath, isPrimary: index === 0 })),
      },
    },
  });

  revalidatePath("/my-ads");
  revalidatePath("/admin");
  redirect("/my-ads?posted=1");
}
