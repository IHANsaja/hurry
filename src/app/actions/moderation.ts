"use server";

import { revalidatePath } from "next/cache";
import { requireModerator } from "@/auth";
import { prisma } from "@/lib/prisma";
import { moderateAdSchema } from "@/lib/validations";
import { sendAdApprovedEmail, sendAdRejectedEmail } from "@/lib/email";
import { AdStatus } from "@/generated/prisma/enums";

export type ModerationState = {
  error?: string;
  success?: string;
};

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function moderateAd(
  _prev: ModerationState,
  formData: FormData,
): Promise<ModerationState> {
  await requireModerator();

  const parsed = moderateAdSchema.safeParse({
    advertisementId: formData.get("advertisementId"),
    decision: formData.get("decision"),
    rejectionNote: formData.get("rejectionNote") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid submission." };
  }

  const { advertisementId, decision, rejectionNote } = parsed.data;
  const approving = decision === "APPROVE";

  let ad;
  try {
    ad = await prisma.advertisement.update({
      where: { id: advertisementId, status: AdStatus.PENDING },
      data: {
        status: approving ? AdStatus.ACTIVE : AdStatus.REJECTED,
        rejectionNote: approving ? null : rejectionNote,
      },
      select: { id: true, title: true, user: { select: { email: true } } },
    });
  } catch {
    return { error: "This ad has already been moderated by someone else." };
  }

  try {
    if (approving) {
      await sendAdApprovedEmail({
        to: ad.user.email,
        adTitle: ad.title,
        adUrl: `${baseUrl}/ads/${ad.id}`,
      });
    } else {
      await sendAdRejectedEmail({
        to: ad.user.email,
        adTitle: ad.title,
        reason: rejectionNote!,
        editUrl: `${baseUrl}/my-ads`,
      });
    }
  } catch (error) {
    console.error("Notification email failed", error);
  }

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/search");

  return { success: approving ? "Ad approved and published." : "Ad rejected and the seller notified." };
}
