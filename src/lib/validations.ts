import { z } from "zod";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const createAdSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title should be at least 5 characters")
    .max(20, "Title should be 20 characters or less"),
  description: z
    .string()
    .trim()
    .min(50, "Description should be at least 50 characters")
    .max(5000, "Description should be 5000 characters or fewer"),
  
  price: z.coerce
    .number({ error: "Price must be a number" })
    .positive("Price must be greater than 0")
    .max(999_999_999, "Price is too large"),
  contactPhone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{7,20}$/, "Enter a valid phone number"),
  categoryId: z.string().min(1, "Please choose a category"),
  locationId: z.string().min(1, "Please choose a location"),
});

export type CreateAdInput = z.infer<typeof createAdSchema>;

export const adImageSchema = z
  .instanceof(File)
  .refine((f) => f.size > 0, "Image file is empty")
  .refine((f) => f.size <= MAX_IMAGE_BYTES, "Each image must be 2 MB or smaller")
  .refine(
    (f) => ALLOWED_IMAGE_TYPES.includes(f.type),
    "Allowed File Types Are JPEG, PNG or WebP",
  );

export const moderateAdSchema = z
  .object({
    advertisementId: z.string().min(1),
    decision: z.enum(["APPROVE", "REJECT"]),
    rejectionNote: z.string().trim().max(500).optional(),
  })
  .refine(
    (v) =>
      v.decision === "APPROVE" ||
      (v.rejectionNote !== undefined && v.rejectionNote.length >= 10),
    {
      message: "A rejection reason of at least 10 characters is required",
      path: ["rejectionNote"],
    },
  );

export const searchParamsSchema = z.object({
  q: z.string().trim().max(120).optional().catch(undefined),
  category: z.string().trim().optional().catch(undefined),
  location: z.string().trim().optional().catch(undefined),
  minPrice: z.coerce.number().nonnegative().optional().catch(undefined),
  maxPrice: z.coerce.number().nonnegative().optional().catch(undefined),
  page: z.coerce.number().int().min(1).default(1).catch(1),
});

export type SearchFilters = z.infer<typeof searchParamsSchema>;
