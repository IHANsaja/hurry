"use client";

import { useActionState } from "react";
import { createAd, type AdFormState } from "@/app/actions/ads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Option = { id: string; name: string };
type Category = Option & { children: Option[] };

type Props = {
  categories: Category[];
  locations: Option[];
};

const selectClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-sm text-destructive">{messages[0]}</p>;
}

export function AdForm({ categories, locations }: Props) {
  const [state, formAction, pending] = useActionState<AdFormState, FormData>(createAd, {});

  return (
    <form action={formAction} className="space-y-6">
      {state.message && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" placeholder="Toyota Aqua 2015 Hybrid" />
        <FieldError messages={state.errors?.title} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={7}
          placeholder="Condition, mileage, service history, reason for selling..."
        />
        <FieldError messages={state.errors?.description} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="price">Price (LKR)</Label>
          <Input id="price" name="price" type="number" min={1} step="0.01" placeholder="850000" />
          <FieldError messages={state.errors?.price} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="contactPhone">Contact number</Label>
          <Input id="contactPhone" name="contactPhone" placeholder="077 123 4567" />
          <FieldError messages={state.errors?.contactPhone} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="categoryId">Category</Label>
          <select id="categoryId" name="categoryId" defaultValue="" className={selectClass}>
            <option value="" disabled>
              Choose a category
            </option>
            {categories.map((parent) => (
              <optgroup key={parent.id} label={parent.name}>
                {parent.children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <FieldError messages={state.errors?.categoryId} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="locationId">Location</Label>
          <select id="locationId" name="locationId" defaultValue="" className={selectClass}>
            <option value="" disabled>
              Choose a location
            </option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
          <FieldError messages={state.errors?.locationId} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="images">Photos</Label>
        <Input
          id="images"
          name="images"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
        />
        <p className="text-xs text-muted-foreground">
          Up to 5 images, 2 MB each. The first one becomes the cover photo.
        </p>
        <FieldError messages={state.errors?.images} />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Submitting..." : "Submit for review"}
        </Button>
        <p className="text-sm text-muted-foreground">
          Your ad goes live once a moderator approves it.
        </p>
      </div>
    </form>
  );
}
