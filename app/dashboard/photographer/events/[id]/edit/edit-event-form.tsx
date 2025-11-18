"use client";

import { useForm } from "@tanstack/react-form";
import { format } from "date-fns";
import { ChevronDownIcon, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, useTransition } from "react";
import { z } from "zod";
import {
  activityOptions,
  activityValues,
} from "@/app/dashboard/photographer/events/new/activity-options";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dropzone } from "@/components/uploader/Dropzone";
import type { Event } from "@/database/queries/events";
import { cn } from "@/lib/utils";
import { updateEventAction } from "./actions";

const eventSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  activity: z
    .string()
    .min(1, "Activity is required.")
    .refine(
      (value): value is (typeof activityValues)[number] =>
        activityValues.includes(value as (typeof activityValues)[number]),
      "Activity is required.",
    ),
  date: z.string().min(1, "Date is required."),
  country: z.string().trim().min(1, "Country is required."),
  city: z.string().trim().min(1, "City is required."),
  is_public: z.boolean().default(true),
  watermark_enabled: z.boolean().default(true),
  price_per_photo: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .optional()
    .transform((val) => {
      if (val === null || val === undefined || val === "") return null;
      const strVal = typeof val === "string" ? val : String(val);
      if (strVal.trim() === "") return null;
      const num = parseFloat(strVal);
      return Number.isNaN(num) || num < 0 ? null : num;
    }),
});

type FormValues = z.infer<typeof eventSchema>;

interface PhotoWithUrl {
  id: string;
  url: string | null;
  original_url: string | null;
}

interface PendingPhoto {
  id: string;
  url: string;
  original_url: null;
  isPending: true;
}

type DisplayPhoto = PhotoWithUrl | PendingPhoto;

interface EditEventFormProps {
  event: Event;
  initialPhotos: PhotoWithUrl[];
}

export function EditEventForm({ event, initialPhotos }: EditEventFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const dateInputId = useId();
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [photos, setPhotos] = useState<PhotoWithUrl[]>(initialPhotos);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [pendingDeletions, setPendingDeletions] = useState<Set<string>>(
    new Set(),
  );

  // Sync photos state when initialPhotos changes (after refresh)
  useEffect(() => {
    setPhotos(initialPhotos);
    setPendingDeletions(new Set());
    setNewFiles([]);
  }, [initialPhotos]);

  // Format date for input (YYYY-MM-DD)
  const eventDate = event.date
    ? format(new Date(event.date), "yyyy-MM-dd")
    : "";

  const defaultValues: FormValues = {
    name: event.name,
    activity: event.activity,
    date: eventDate,
    country: event.country,
    city: event.city,
    is_public: event.is_public,
    watermark_enabled: event.watermark_enabled,
    price_per_photo: event.price_per_photo,
  };

  const handleDeletePhoto = (photoId: string) => {
    setPendingDeletions((prev) => new Set(prev).add(photoId));
  };

  const handleFiles = (incoming: File[]) => {
    setNewFiles((prev) => {
      const next = [...prev];
      for (const file of incoming) {
        const exists = next.some(
          (item) =>
            item.name === file.name &&
            item.size === file.size &&
            item.lastModified === file.lastModified,
        );
        if (!exists) next.push(file);
      }
      return next;
    });
  };

  const removeFile = (target: File) => {
    setNewFiles((prev) => prev.filter((file) => file !== target));
  };

  // Create preview URLs for new files
  const [newFilePreviews, setNewFilePreviews] = useState<PendingPhoto[]>([]);

  useEffect(() => {
    const previews: PendingPhoto[] = newFiles.map((file) => ({
      id: `pending-${file.name}-${file.lastModified}`,
      url: URL.createObjectURL(file),
      original_url: null,
      isPending: true as const,
    }));
    setNewFilePreviews(previews);

    // Cleanup function to revoke URLs when files change or component unmounts
    return () => {
      for (const preview of previews) {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [newFiles]);

  // Filter out deleted photos and combine with new file previews
  const visiblePhotos: DisplayPhoto[] = [
    ...photos.filter((p) => !pendingDeletions.has(p.id)),
    ...newFilePreviews,
  ];

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        const parsed = eventSchema.parse(value);
        setSubmitError(null);

        const formData = new FormData();
        formData.append("name", parsed.name.trim());
        formData.append("activity", parsed.activity);
        formData.append("date", parsed.date);
        formData.append("country", parsed.country.trim());
        formData.append("city", parsed.city.trim());
        formData.append("is_public", parsed.is_public ? "true" : "false");
        formData.append(
          "watermark_enabled",
          parsed.watermark_enabled ? "true" : "false",
        );
        if (
          parsed.price_per_photo !== undefined &&
          parsed.price_per_photo !== null
        ) {
          const price =
            typeof parsed.price_per_photo === "string"
              ? parseFloat(parsed.price_per_photo)
              : parsed.price_per_photo;
          if (!Number.isNaN(price) && price >= 0) {
            formData.append("price_per_photo", price.toString());
          }
        }

        // Create FormData with photos and deletions
        const photoFormData = new FormData();
        for (const file of newFiles) {
          photoFormData.append("photos", file);
        }
        const photoIdsToDelete = Array.from(pendingDeletions);

        startTransition(async () => {
          try {
            const result = await updateEventAction(
              event.id,
              formData,
              photoFormData,
              photoIdsToDelete,
            );
            if (result?.success) {
              router.push(`/dashboard/photographer/events/${event.id}`);
            }
          } catch (error) {
            console.error(error);
            setSubmitError(
              error instanceof Error
                ? error.message
                : "Something went wrong. Please try again.",
            );
          }
        });
      } catch (error) {
        console.error(error);
        if (error instanceof z.ZodError) {
          setSubmitError(error.issues[0]?.message ?? "Invalid form data");
        }
      }
    },
  });

  return (
    <div className="mx-auto w-full max-w-7xl">
      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitAttempted(true);
          form.handleSubmit();
        }}
        noValidate
        suppressHydrationWarning
      >
        {submitError && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
            {submitError}
          </div>
        )}

        {/* Top Row: Form and Upload Section */}
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          {/* Left Half: Form */}
          <div className="space-y-4" suppressHydrationWarning>
            {/* Row 1: Name + Activity */}
            <div className="grid gap-4 md:grid-cols-2">
              <form.Field
                name="name"
                validators={{
                  onChange: ({ value }) =>
                    value.trim().length === 0 ? "Name is required." : undefined,
                }}
              >
                {(field) => {
                  const showFeedback =
                    submitAttempted || field.state.meta.isTouched;
                  const error = showFeedback
                    ? field.state.meta.errors?.[0]
                    : null;
                  const isInvalid = showFeedback && !field.state.meta.isValid;
                  return (
                    <div>
                      <Label htmlFor="name">Name or place</Label>
                      <Input
                        id="name"
                        className="mt-2"
                        value={field.state.value}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                        onBlur={field.handleBlur}
                        placeholder="Event name or place"
                        aria-invalid={isInvalid}
                        autoComplete="off"
                        suppressHydrationWarning
                      />
                      {isInvalid && error ? (
                        <p className="mt-1 text-xs text-destructive">{error}</p>
                      ) : null}
                    </div>
                  );
                }}
              </form.Field>

              <form.Field
                name="activity"
                validators={{
                  onChange: ({ value }) =>
                    value &&
                    activityValues.includes(
                      value as (typeof activityValues)[number],
                    )
                      ? undefined
                      : "Activity is required.",
                }}
              >
                {(field) => {
                  const showFeedback =
                    submitAttempted || field.state.meta.isTouched;
                  const error = showFeedback
                    ? field.state.meta.errors?.[0]
                    : null;
                  const isInvalid = showFeedback && !field.state.meta.isValid;
                  return (
                    <div className="grid gap-2">
                      <Label htmlFor="activity">Activity</Label>
                      <Select
                        value={field.state.value}
                        onValueChange={(value) => {
                          field.handleChange(value as FormValues["activity"]);
                          field.handleBlur();
                        }}
                      >
                        <SelectTrigger
                          id="activity"
                          className="w-full rounded-md"
                          aria-invalid={isInvalid}
                        >
                          <SelectValue placeholder="Select an activity" />
                        </SelectTrigger>
                        <SelectContent className="w-[--radix-select-trigger-width]">
                          {activityOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isInvalid && error ? (
                        <p className="text-xs text-destructive">{error}</p>
                      ) : null}
                    </div>
                  );
                }}
              </form.Field>
            </div>

            {/* Row 2: City + Country */}
            <div className="grid gap-4 md:grid-cols-2">
              <form.Field
                name="city"
                validators={{
                  onChange: ({ value }) =>
                    value.trim().length === 0 ? "City is required." : undefined,
                }}
              >
                {(field) => {
                  const showFeedback =
                    submitAttempted || field.state.meta.isTouched;
                  const error = showFeedback
                    ? field.state.meta.errors?.[0]
                    : null;
                  const isInvalid = showFeedback && !field.state.meta.isValid;
                  return (
                    <div className="grid gap-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={field.state.value}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                        onBlur={field.handleBlur}
                        placeholder="City"
                        aria-invalid={isInvalid}
                        autoComplete="address-level2"
                        suppressHydrationWarning
                      />
                      {isInvalid && error ? (
                        <p className="text-xs text-destructive">{error}</p>
                      ) : null}
                    </div>
                  );
                }}
              </form.Field>

              <form.Field
                name="country"
                validators={{
                  onChange: ({ value }) =>
                    value.trim().length === 0
                      ? "Country is required."
                      : undefined,
                }}
              >
                {(field) => {
                  const showFeedback =
                    submitAttempted || field.state.meta.isTouched;
                  const error = showFeedback
                    ? field.state.meta.errors?.[0]
                    : null;
                  const isInvalid = showFeedback && !field.state.meta.isValid;
                  return (
                    <div className="grid gap-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={field.state.value}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                        onBlur={field.handleBlur}
                        placeholder="Country"
                        aria-invalid={isInvalid}
                        autoComplete="country-name"
                        suppressHydrationWarning
                      />
                      {isInvalid && error ? (
                        <p className="text-xs text-destructive">{error}</p>
                      ) : null}
                    </div>
                  );
                }}
              </form.Field>
            </div>

            {/* Row 3: Date + Price per Photo */}
            <div className="grid gap-4 md:grid-cols-2">
              <form.Field
                name="date"
                validators={{
                  onChange: ({ value }) =>
                    value && value.length > 0 ? undefined : "Date is required.",
                }}
              >
                {(field) => {
                  const showFeedback =
                    submitAttempted || field.state.meta.isTouched;
                  const error = showFeedback
                    ? field.state.meta.errors?.[0]
                    : null;
                  const isInvalid = showFeedback && !field.state.meta.isValid;
                  const parsedDate = field.state.value
                    ? new Date(field.state.value)
                    : undefined;
                  return (
                    <div className="grid gap-2">
                      <Label htmlFor={dateInputId}>Date</Label>
                      <Popover
                        open={datePopoverOpen}
                        onOpenChange={setDatePopoverOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "w-full justify-between rounded-md border border-input text-left font-normal",
                              !parsedDate && "text-muted-foreground",
                            )}
                            aria-invalid={isInvalid}
                          >
                            {parsedDate
                              ? format(parsedDate, "PPP")
                              : "Select date"}
                            <ChevronDownIcon className="size-4 opacity-60" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto overflow-hidden p-0"
                          align="start"
                        >
                          <Calendar
                            mode="single"
                            selected={parsedDate}
                            captionLayout="dropdown"
                            onSelect={(date) => {
                              field.handleChange(
                                date ? format(date, "yyyy-MM-dd") : "",
                              );
                              field.handleBlur();
                              setDatePopoverOpen(false);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <input
                        id={dateInputId}
                        type="hidden"
                        value={field.state.value}
                        readOnly
                        suppressHydrationWarning
                      />
                      {isInvalid && error ? (
                        <p className="text-xs text-destructive">{error}</p>
                      ) : null}
                    </div>
                  );
                }}
              </form.Field>

              <form.Field
                name="price_per_photo"
                validators={{
                  onChange: ({ value }) => {
                    if (value === undefined || value === null) {
                      return undefined; // Optional field
                    }
                    const num =
                      typeof value === "string" ? parseFloat(value) : value;
                    if (Number.isNaN(num)) {
                      return "Price must be a valid number.";
                    }
                    if (num < 0) {
                      return "Price cannot be negative.";
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => {
                  const showFeedback =
                    submitAttempted || field.state.meta.isTouched;
                  const error = showFeedback
                    ? field.state.meta.errors?.[0]
                    : null;
                  const isInvalid = showFeedback && !field.state.meta.isValid;
                  return (
                    <div className="grid gap-2">
                      <Label htmlFor="price_per_photo">
                        Price per Photo (Optional)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          $
                        </span>
                        <Input
                          id="price_per_photo"
                          type="number"
                          step="0.01"
                          min="0"
                          value={
                            field.state.value === null ||
                            field.state.value === undefined
                              ? ""
                              : typeof field.state.value === "string"
                                ? field.state.value
                                : field.state.value.toString()
                          }
                          onChange={(event) => {
                            const val = event.target.value;
                            if (val === "") {
                              field.handleChange(null);
                            } else {
                              const num = parseFloat(val);
                              if (!Number.isNaN(num)) {
                                field.handleChange(num);
                              } else {
                                field.handleChange(val as unknown as number);
                              }
                            }
                          }}
                          onBlur={field.handleBlur}
                          placeholder="0.00"
                          aria-invalid={isInvalid}
                          className="pl-7"
                          suppressHydrationWarning
                        />
                      </div>
                      {isInvalid && error ? (
                        <p className="text-xs text-destructive">{error}</p>
                      ) : null}
                    </div>
                  );
                }}
              </form.Field>
            </div>

            <form.Field name="is_public">
              {(field) => {
                return (
                  <div className="flex items-center justify-between gap-4 rounded-lg border border-input p-3">
                    <div className="grid gap-1">
                      <Label htmlFor="is_public">Event Visibility</Label>
                      <p className="text-xs text-muted-foreground">
                        {field.state.value
                          ? "Anyone can access this event"
                          : "Only people with the share code can access"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {field.state.value ? "Public" : "Private"}
                      </span>
                      <Switch
                        id="is_public"
                        checked={field.state.value}
                        onCheckedChange={(checked) => {
                          field.handleChange(checked);
                          field.handleBlur();
                          // Auto-enable watermark when making event public
                          if (checked) {
                            form.setFieldValue("watermark_enabled", true);
                          }
                        }}
                      />
                    </div>
                  </div>
                );
              }}
            </form.Field>

            <form.Field name="watermark_enabled">
              {(field) => {
                const isPublic = form.state.values.is_public;
                return (
                  <div className="flex items-center justify-between gap-4 rounded-lg border border-input p-3">
                    <div className="grid gap-1">
                      <Label htmlFor="watermark_enabled">
                        Watermark on Photos
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {isPublic
                          ? "Add watermark for talent users (photographers see originals)"
                          : "Only applies to public events"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {field.state.value ? "Enabled" : "Disabled"}
                      </span>
                      <Switch
                        id="watermark_enabled"
                        checked={field.state.value}
                        onCheckedChange={(checked) => {
                          field.handleChange(checked);
                          field.handleBlur();
                        }}
                        disabled={!isPublic}
                      />
                    </div>
                  </div>
                );
              }}
            </form.Field>
          </div>

          {/* Right Half: Upload Section */}
          <div className="flex flex-col gap-2 lg:sticky lg:top-4">
            <Label>Add Photos</Label>
            <p className="text-xs text-muted-foreground">
              Photos will be added when you save changes
            </p>
            <Dropzone
              accept=".jpg,.jpeg,.png,.heic"
              onSelect={handleFiles}
              className="rounded-lg lg:min-h-[400px]"
            />
          </div>
        </div>

        {/* Photos Section - Full Width */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Event Photos</h3>

          {/* Existing Photos Grid */}
          {visiblePhotos.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {visiblePhotos.map((photo) => {
                const isPending = "isPending" in photo && photo.isPending;
                const isDeleted = !isPending && pendingDeletions.has(photo.id);
                if (isDeleted) return null;

                return (
                  <div
                    key={photo.id}
                    className="group relative aspect-square overflow-visible rounded-lg"
                  >
                    <div
                      className={`absolute inset-0 overflow-hidden rounded-lg border bg-muted ${
                        isPending ? "border-dashed border-primary/50" : ""
                      }`}
                    >
                      {photo.url ? (
                        <Image
                          src={photo.url}
                          alt={isPending ? "Pending photo" : "Event photo"}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                          No preview
                        </div>
                      )}
                      {/* {isPending && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                          <span className="text-xs font-medium text-primary">
                            Pending
                          </span>
                        </div>
                      )} */}
                    </div>
                    {!isPending && (
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="absolute -right-1 -top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-foreground/80 text-gray-300 shadow-sm opacity-0 transition-opacity hover:bg-foreground group-hover:opacity-100"
                        aria-label="Delete photo"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => {
                          const file = newFiles.find(
                            (f) =>
                              `pending-${f.name}-${f.lastModified}` ===
                              photo.id,
                          );
                          if (file) {
                            removeFile(file);
                          }
                        }}
                        className="absolute -right-1 -top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-foreground/80 text-gray-300 shadow-sm opacity-0 transition-opacity hover:bg-foreground group-hover:opacity-100"
                        aria-label="Remove pending photo"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-muted-foreground/30 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No photos yet. Add photos using the upload area above.
              </p>
            </div>
          )}
        </div>

        {/* Bottom Right: Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
