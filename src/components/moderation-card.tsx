"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { moderateAd, type ModerationState } from "@/app/actions/moderation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Props = {
  ad: {
    id: string;
    title: string;
    description: string;
    price: string;
    createdAt: string;
    contactPhone: string;
    seller: string;
    sellerEmail: string;
    category: string;
    location: string;
    images: { filePath: string }[];
  };
};

export function ModerationCard({ ad }: Props) {
  const [state, formAction, pending] = useActionState<ModerationState, FormData>(moderateAd, {});
  const [rejecting, setRejecting] = useState(false);

  if (state.success) {
    return (
      <li className="rounded-lg border bg-background p-4">
        <Alert>
          <AlertDescription>
            <strong>{ad.title}</strong> — {state.success}
          </AlertDescription>
        </Alert>
      </li>
    );
  }

  return (
    <li className="rounded-lg border bg-background p-4">
      <div className="flex gap-4">
        <div className="relative size-28 shrink-0 overflow-hidden rounded-md bg-muted">
          {ad.images[0] && (
            <Image src={ad.images[0].filePath} alt="" fill sizes="112px" className="object-cover" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-medium">{ad.title}</h2>
            <span className="shrink-0 font-semibold">{ad.price}</span>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="secondary">{ad.category}</Badge>
            <Badge variant="outline">{ad.location}</Badge>
            <span className="text-muted-foreground">{ad.createdAt}</span>
          </div>

          <p className="text-sm text-muted-foreground">{ad.description}</p>

          <p className="text-xs text-muted-foreground">
            {ad.seller} · {ad.sellerEmail} · {ad.contactPhone}
          </p>

          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <form action={formAction} className="space-y-3 pt-1">
            <input type="hidden" name="advertisementId" value={ad.id} />

            {rejecting && (
              <div className="space-y-1.5">
                <Label htmlFor={`note-${ad.id}`}>Reason for rejection</Label>
                <Textarea
                  id={`note-${ad.id}`}
                  name="rejectionNote"
                  rows={3}
                  placeholder="Tell the seller what to change before resubmitting."
                />
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {rejecting ? (
                <>
                  <Button
                    type="submit"
                    name="decision"
                    value="REJECT"
                    variant="destructive"
                    size="sm"
                    disabled={pending}
                  >
                    {pending ? "Rejecting..." : "Confirm rejection"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setRejecting(false)}
                    disabled={pending}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="submit"
                    name="decision"
                    value="APPROVE"
                    size="sm"
                    disabled={pending}
                  >
                    {pending ? "Approving..." : "Approve"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRejecting(true)}
                    disabled={pending}
                  >
                    Reject
                  </Button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </li>
  );
}
