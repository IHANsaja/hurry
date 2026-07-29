"use client";

import { useActionState, useState } from "react";
import { createAd, type AdFormState } from "@/app/actions/ads";
import {
  TITLE_MIN,
  TITLE_MAX,
  DESCRIPTION_MIN,
  DESCRIPTION_MAX,
} from "@/lib/validations";
import { cn } from "@/lib/utils";
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

function CharCount({ length, min, max }: { length: number; min: number; max: number }) {
  const tooShort = length > 0 && length < min;
  const tooLong = length > max;

  const hint = tooShort
    ? `${min - length} more to go`
    : tooLong
      ? `${length - max} over`
      : null;

  return (
    <span
      className={cn(
        "text-xs tabular-nums",
        tooShort || tooLong ? "text-destructive" : "text-muted-foreground",
      )}
    >
      {hint && <span className="mr-2">{hint}</span>}
      {length}/{max}
    </span>
  );
}

const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export function AdForm({ categories, locations }: Props) {
  const [state, formAction, pending] = useActionState<AdFormState, FormData>(createAd, {});
  const [fileError, setFileError] = useState<string | null>(null);
  const [titleLength, setTitleLength] = useState(0);
  const [descriptionLength, setDescriptionLength] = useState(0);

  // Oversized uploads are rejected by Next before the action runs, which
  // surfaces as a crash rather than a form error. Catch it here first.
  function validateFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (files.length > MAX_IMAGES) {
      setFileError(`Choose at most ${MAX_IMAGES} images (you selected ${files.length}).`);
      return;
    }

    const tooBig = files.find((file) => file.size > MAX_IMAGE_BYTES);
    if (tooBig) {
      const mb = (tooBig.size / 1024 / 1024).toFixed(1);
      setFileError(`"${tooBig.name}" is ${mb} MB. Each image must be 2 MB or smaller.`);
      return;
    }

    setFileError(null);
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.message && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <Label htmlFor="title">Title</Label>
          <CharCount length={titleLength} min={TITLE_MIN} max={TITLE_MAX} />
        </div>
        <Input
          id="title"
          name="title"
          placeholder="Honda Civic 2019"
          onChange={(e) => setTitleLength(e.target.value.trim().length)}
        />
        <FieldError messages={state.errors?.title} />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <Label htmlFor="description">Description</Label>
          <CharCount length={descriptionLength} min={DESCRIPTION_MIN} max={DESCRIPTION_MAX} />
        </div>
        <Textarea
          id="description"
          name="description"
          rows={7}
          placeholder="Condition, mileage, service history, reason for selling..."
          onChange={(e) => setDescriptionLength(e.target.value.trim().length)}
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
          onChange={validateFiles}
        />
        <p className="text-xs text-muted-foreground">
          Up to 5 images, 2 MB each. The first one becomes the cover photo.
        </p>
        {fileError ? (
          <p className="text-sm text-destructive">{fileError}</p>
        ) : (
          <FieldError messages={state.errors?.images} />
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending || fileError !== null}>
          {pending ? "Submitting..." : "Submit for review"}
        </Button>
        <p className="text-sm text-muted-foreground">
          Your ad goes live once a moderator approves it.
        </p>
      </div>
    </form>
  );
}
