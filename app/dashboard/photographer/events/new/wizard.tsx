"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "@tanstack/react-form";
import { Country, State } from "country-state-city";
import { format } from "date-fns";
import { ChevronDownIcon, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState, useTransition } from "react";
import { z } from "zod";
import { DashboardHeader } from "@/components/dashboard-header";
import { EventShareCode } from "@/components/event-share-code";
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
import { cn } from "@/lib/utils";
import { createEvent } from "./actions";
import { activityOptions, activityValues } from "./activity-options";

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
  state: z.string().trim().min(1, "State/Province is required."),
  city: z.string().trim().optional(),
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

const STORAGE_KEY = "shootea_new_event_form";

const getDefaultValues = (): FormValues => {
  if (typeof window === "undefined") {
    return {
      name: "",
      activity: "",
      date: "",
      country: "",
      state: "",
      city: "",
      is_public: true,
      watermark_enabled: true,
      price_per_photo: null,
    };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        name: parsed.name || "",
        activity: parsed.activity || "",
        date: parsed.date || "",
        country: parsed.country || "",
        state: parsed.state || "",
        city: parsed.city || "",
        is_public: parsed.is_public ?? true,
        watermark_enabled: parsed.watermark_enabled ?? true,
        price_per_photo: parsed.price_per_photo ?? null,
      };
    }
  } catch {
    // Ignore parse errors
  }

  return {
    name: "",
    activity: "",
    date: "",
    country: "",
    state: "",
    city: "",
    is_public: true,
    watermark_enabled: true,
    price_per_photo: null,
  };
};

const defaultValues = getDefaultValues();

export default function NewEventForm() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null);
  const [photosError, setPhotosError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [createdShareCode, setCreatedShareCode] = useState<string | null>(null);
  const [createdEventName, setCreatedEventName] = useState<string | null>(null);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const dateInputId = useId();
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [filePreviews, setFilePreviews] = useState<
    Array<{ id: string; url: string; file: File }>
  >([]);

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        const parsed = eventSchema.parse(value);
        if (files.length === 0) {
          setPhotosError("Add at least one photo to continue.");
          return;
        }
        setPhotosError(null);
        setSubmitError(null);
        setPendingValues(parsed);
        setIsModalOpen(true);
        setSubmitAttempted(false);
      } catch (error) {
        console.error(error);
      }
    },
  });

  // Load from localStorage on mount
  useEffect(() => {
    const stored = getDefaultValues();
    if (stored.name || stored.activity || stored.date) {
      form.setFieldValue("name", stored.name);
      form.setFieldValue("activity", stored.activity);
      form.setFieldValue("date", stored.date);
      form.setFieldValue("country", stored.country);
      form.setFieldValue("state", stored.state);
      form.setFieldValue("city", stored.city || "");
      form.setFieldValue("is_public", stored.is_public);
      form.setFieldValue("watermark_enabled", stored.watermark_enabled);
      form.setFieldValue("price_per_photo", stored.price_per_photo);
    }
  }, [form.setFieldValue]);

  // Save to localStorage whenever form values change
  useEffect(() => {
    const values = form.state.values;
    const hasData =
      values.name ||
      values.activity ||
      values.date ||
      values.country ||
      values.state ||
      values.city;
    if (hasData) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
      } catch {
        // Ignore storage errors
      }
    }
  }, [form.state.values]);

  // Generate preview URLs for files
  useEffect(() => {
    const previews = files.map((file) => ({
      id: `preview-${file.name}-${file.lastModified}`,
      url: URL.createObjectURL(file),
      file,
    }));
    setFilePreviews(previews);

    return () => {
      // Cleanup object URLs
      previews.forEach((preview) => {
        URL.revokeObjectURL(preview.url);
      });
    };
  }, [files]);

  const handleFiles = (incoming: File[]) => {
    setFiles((prev) => {
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
    if (incoming.length > 0) {
      setPhotosError(null);
    }
  };

  const removeFile = (targetFile: File) => {
    setFiles((prev) => {
      const next = prev.filter((file) => file !== targetFile);
      if (submitAttempted && next.length === 0) {
        setPhotosError("Add at least one photo to continue.");
      } else if (next.length > 0) {
        setPhotosError(null);
      }
      return next;
    });
  };

  const confirmCreation = () => {
    const value = pendingValues;
    if (!value || isPending) return;
    if (files.length === 0) {
      setPhotosError("Add at least one photo to continue.");
      setIsModalOpen(false);
      return;
    }
    const formData = new FormData();
    formData.append("name", value.name.trim());
    formData.append("activity", value.activity);
    formData.append("date", value.date);
    formData.append("country", value.country.trim());
    formData.append("state", value.state.trim());
    if (value.city?.trim()) {
      formData.append("city", value.city.trim());
    }
    formData.append("is_public", value.is_public ? "true" : "false");
    formData.append(
      "watermark_enabled",
      value.watermark_enabled ? "true" : "false",
    );
    if (value.price_per_photo !== undefined && value.price_per_photo !== null) {
      const price =
        typeof value.price_per_photo === "string"
          ? parseFloat(value.price_per_photo)
          : value.price_per_photo;
      if (!Number.isNaN(price) && price >= 0) {
        formData.append("price_per_photo", price.toString());
      }
    }
    for (const file of files) {
      formData.append("photos", file);
    }

    startTransition(async () => {
      try {
        const result = await createEvent(formData);
        if (!result?.eventId) {
          throw new Error("Event could not be created");
        }
        setSubmitError(null);
        setIsModalOpen(false);
        // Clear localStorage on success
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          // Ignore storage errors
        }
        // If event is private, show share code before redirecting
        if (!value.is_public && result.shareCode) {
          setCreatedShareCode(result.shareCode);
          setCreatedEventName(value.name);
          setCreatedEventId(result.eventId);
          // Redirect after a short delay to show the share code
          setTimeout(() => {
            router.push(`/dashboard/photographer/events/${result.eventId}`);
          }, 5000);
        } else {
          router.push(`/dashboard/photographer/events/${result.eventId}`);
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
  };

  const eventSummary = useMemo(() => {
    const source = pendingValues ?? form.state.values;
    const price =
      source.price_per_photo !== null && source.price_per_photo !== undefined
        ? `$${typeof source.price_per_photo === "string" ? parseFloat(source.price_per_photo).toFixed(2) : source.price_per_photo.toFixed(2)}`
        : "Free";

    // Get country name
    const countryName = source.country
      ? (Country.getAllCountries().find((c) => c.isoCode === source.country)
          ?.name ?? source.country)
      : "";

    // Get state name
    const stateName =
      source.country && source.state
        ? (State.getStatesOfCountry(source.country).find(
            (s) => s.isoCode === source.state,
          )?.name ?? source.state)
        : source.state || "";

    return [
      { label: "Name", value: source.name },
      {
        label: "Activity",
        value:
          activityOptions.find((option) => option.value === source.activity)
            ?.label ?? source.activity,
      },
      {
        label: "Date",
        value: source.date ? format(new Date(source.date), "PPP") : "",
      },
      { label: "Country", value: countryName },
      ...(stateName ? [{ label: "State / Province", value: stateName }] : []),
      ...(source.city ? [{ label: "City", value: source.city }] : []),
      {
        label: "Visibility",
        value: source.is_public ? "Public" : "Private",
      },
      {
        label: "Watermark",
        value:
          source.is_public && source.watermark_enabled ? "Enabled" : "Disabled",
      },
      { label: "Price per Photo", value: price },
      { label: "Photos", value: `${files.length} selected` },
    ];
  }, [pendingValues, form.state.values, files.length]);

  return (
    <div>
      <div className="mx-auto w-full max-w-full space-y-6">
        <header>
          <DashboardHeader title="Create Event" />
          <p className="mt-1 text-sm text-muted-foreground">
            Fill the details and add your photos.
          </p>
        </header>

        {/* Unified layout: Desktop split, Mobile stacked */}
        <div className="grid min-w-0 gap-6 lg:grid-cols-2 lg:items-stretch">
          {/* Form section - left side on desktop */}
          <div className="order-2 min-w-0 w-full lg:sticky lg:top-4">
            <form
              className="flex h-full flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                setSubmitAttempted(true);
                form.handleSubmit();
              }}
              noValidate
              suppressHydrationWarning
            >
              <div className="grid gap-4" suppressHydrationWarning>
                {/* Row 1: Name + Activity (paired on desktop) */}
                <div className="grid gap-4 md:grid-cols-2">
                  <form.Field
                    name="name"
                    validators={{
                      onChange: ({ value }) =>
                        value.trim().length === 0
                          ? "Name is required."
                          : undefined,
                    }}
                  >
                    {(field) => {
                      const showFeedback =
                        submitAttempted || field.state.meta.isTouched;
                      const error = showFeedback
                        ? field.state.meta.errors?.[0]
                        : null;
                      const isInvalid =
                        showFeedback && !field.state.meta.isValid;
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
                            <p className="text-xs text-destructive">{error}</p>
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
                      const isInvalid =
                        showFeedback && !field.state.meta.isValid;
                      return (
                        <div className="grid gap-2">
                          <Label htmlFor="activity">Activity</Label>
                          <Select
                            value={field.state.value}
                            onValueChange={(value) => {
                              field.handleChange(
                                value as FormValues["activity"],
                              );
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
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
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

                {/* Row 2: Location (Country, State, City) */}
                <form.Field
                  name="country"
                  validators={{
                    onChange: ({ value }) =>
                      value.trim().length === 0
                        ? "Country is required."
                        : undefined,
                  }}
                >
                  {(countryField) => (
                    <form.Field
                      name="state"
                      validators={{
                        onChange: ({ value }) =>
                          value.trim().length === 0
                            ? "State/Province is required."
                            : undefined,
                      }}
                    >
                      {(stateField) => (
                        <form.Field
                          name="city"
                          validators={{
                            onChange: () => undefined, // City is optional
                          }}
                        >
                          {(cityField) => {
                            const showFeedback =
                              submitAttempted ||
                              countryField.state.meta.isTouched ||
                              stateField.state.meta.isTouched ||
                              cityField.state.meta.isTouched;
                            const countryError = showFeedback
                              ? countryField.state.meta.errors?.[0]
                              : null;
                            const stateError = showFeedback
                              ? stateField.state.meta.errors?.[0]
                              : null;
                            const states = State.getStatesOfCountry(
                              countryField.state.value,
                            );
                            return (
                              <div className="space-y-4">
                                {/* Country and State side-by-side */}
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div className="grid gap-2">
                                    <Label htmlFor="country">Country</Label>
                                    <Select
                                      value={countryField.state.value}
                                      onValueChange={(value) => {
                                        countryField.handleChange(value);
                                        countryField.handleBlur();
                                      }}
                                    >
                                      <SelectTrigger
                                        id="country"
                                        aria-invalid={
                                          showFeedback && !!countryError
                                        }
                                        className={cn(
                                          "w-full",
                                          showFeedback &&
                                            countryError &&
                                            "border-destructive",
                                        )}
                                      >
                                        <SelectValue placeholder="Select a country" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Country.getAllCountries()
                                          .sort((a, b) =>
                                            a.name.localeCompare(b.name),
                                          )
                                          .map((c) => (
                                            <SelectItem
                                              key={c.isoCode}
                                              value={c.isoCode}
                                            >
                                              {c.name}
                                            </SelectItem>
                                          ))}
                                      </SelectContent>
                                    </Select>
                                    {showFeedback && countryError ? (
                                      <p className="text-xs text-destructive">
                                        {countryError}
                                      </p>
                                    ) : null}
                                  </div>

                                  <div className="grid gap-2">
                                    <Label htmlFor="state">
                                      State / Province
                                    </Label>
                                    {states.length > 0 ? (
                                      <Select
                                        value={stateField.state.value}
                                        onValueChange={(value) => {
                                          stateField.handleChange(value);
                                          stateField.handleBlur();
                                        }}
                                      >
                                        <SelectTrigger
                                          id="state"
                                          aria-invalid={
                                            showFeedback && !!stateError
                                          }
                                          className={cn(
                                            "w-full",
                                            showFeedback &&
                                              stateError &&
                                              "border-destructive",
                                          )}
                                        >
                                          <SelectValue placeholder="Select a state or province" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {states
                                            .sort((a, b) =>
                                              a.name.localeCompare(b.name),
                                            )
                                            .map((s) => (
                                              <SelectItem
                                                key={s.isoCode}
                                                value={s.isoCode}
                                              >
                                                {s.name}
                                              </SelectItem>
                                            ))}
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <Input
                                        id="state"
                                        value={stateField.state.value}
                                        onChange={(e) => {
                                          stateField.handleChange(
                                            e.target.value,
                                          );
                                          stateField.handleBlur();
                                        }}
                                        placeholder="Enter state or province name"
                                        aria-invalid={
                                          showFeedback && !!stateError
                                        }
                                        className={cn(
                                          showFeedback &&
                                            stateError &&
                                            "border-destructive",
                                        )}
                                        autoComplete="address-level1"
                                        suppressHydrationWarning
                                      />
                                    )}
                                    {showFeedback && stateError ? (
                                      <p className="text-xs text-destructive">
                                        {stateError}
                                      </p>
                                    ) : null}
                                  </div>
                                </div>

                                {/* City below */}
                                <div className="grid gap-2">
                                  <Label htmlFor="city">City (Optional)</Label>
                                  <Input
                                    id="city"
                                    value={cityField.state.value || ""}
                                    onChange={(e) => {
                                      cityField.handleChange(e.target.value);
                                      cityField.handleBlur();
                                    }}
                                    placeholder="Enter city name"
                                    autoComplete="address-level2"
                                    suppressHydrationWarning
                                  />
                                </div>
                              </div>
                            );
                          }}
                        </form.Field>
                      )}
                    </form.Field>
                  )}
                </form.Field>

                {/* Row 3: Date + Price per Photo (paired on desktop) */}
                <div className="grid gap-4 md:grid-cols-2">
                  <form.Field
                    name="date"
                    validators={{
                      onChange: ({ value }) =>
                        value && value.length > 0
                          ? undefined
                          : "Date is required.",
                    }}
                  >
                    {(field) => {
                      const showFeedback =
                        submitAttempted || field.state.meta.isTouched;
                      const error = showFeedback
                        ? field.state.meta.errors?.[0]
                        : null;
                      const isInvalid =
                        showFeedback && !field.state.meta.isValid;
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
                      const isInvalid =
                        showFeedback && !field.state.meta.isValid;
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
                                    field.handleChange(
                                      val as unknown as number,
                                    );
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
                              // Auto-toggle watermark based on visibility
                              if (checked) {
                                // Enable watermark when making event public
                                form.setFieldValue("watermark_enabled", true);
                              } else {
                                // Disable watermark when making event private
                                form.setFieldValue("watermark_enabled", false);
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
                    return (
                      <div className="flex items-center justify-between gap-4 rounded-lg border border-input p-3">
                        <div className="grid gap-1">
                          <Label htmlFor="watermark_enabled">
                            Watermark on Photos
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Add watermark for talent users (photographers see
                            originals)
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
                          />
                        </div>
                      </div>
                    );
                  }}
                </form.Field>
              </div>
            </form>
          </div>

          {/* Upload section - right side on desktop */}
          <div className="order-1 flex flex-col gap-2 lg:sticky lg:top-4">
            <Label>Add Photos</Label>
            <Dropzone
              accept=".jpg,.jpeg,.png,.heic"
              onSelect={handleFiles}
              className="flex-1 rounded-lg"
            />
            {photosError ? (
              <p className="text-sm text-destructive">{photosError}</p>
            ) : null}
          </div>
        </div>

        {/* Photos Preview Section - Full Width Below */}
        {filePreviews.length > 0 && (
          <div className="space-y-2 pb-24">
            <h3 className="text-lg font-semibold">Event Photos</h3>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
              {filePreviews.map((preview) => (
                <div
                  key={preview.id}
                  className="group relative aspect-square overflow-visible rounded-lg"
                >
                  <div className="absolute inset-0 overflow-hidden rounded-lg border border-dashed border-primary/50 bg-muted">
                    <Image
                      src={preview.url}
                      alt={`Preview ${preview.file.name}`}
                      fill
                      sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 14vw"
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(preview.file)}
                    className="absolute -right-1 -top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-foreground/80 text-gray-300 shadow-sm opacity-0 transition-opacity hover:bg-foreground group-hover:opacity-100"
                    aria-label="Remove photo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fixed Action Buttons - Bottom */}
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 shadow-lg backdrop-blur supports-backdrop-filter:bg-background/80 md:left-(--sidebar-width)">
          <div className="mx-auto flex w-full max-w-full flex-col items-end gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
            {submitError ? (
              <p className="text-sm text-destructive text-right sm:text-left">
                {submitError}
              </p>
            ) : null}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setSubmitAttempted(true);
                  form.handleSubmit();
                }}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Creating Event...
                  </>
                ) : (
                  "Create Event"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-100" />
          <Dialog.Content className="fixed inset-x-4 top-1/2 z-120 mx-auto w-full max-w-md -translate-y-1/2 rounded-2xl bg-background p-6 shadow-lg focus:outline-none">
            <Dialog.Title className="text-lg font-semibold">
              Confirm details
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
              Review and confirm your event information.
            </Dialog.Description>
            <div className="mt-4 grid gap-2 text-sm">
              {eventSummary.map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between gap-4 border-b border-border/40 pb-2 last:border-b-0 last:pb-0"
                >
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium">{item.value || "—"}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" className="rounded-md">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                type="button"
                onClick={confirmCreation}
                disabled={isPending}
                className="rounded-md"
              >
                {isPending ? (
                  <>
                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Uploading Photos...
                  </>
                ) : (
                  "Confirm"
                )}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {createdShareCode && createdEventName && (
        <Dialog.Root open={true} onOpenChange={() => {}}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/40 z-100" />
            <Dialog.Content className="fixed inset-x-4 top-1/2 z-120 mx-auto w-full max-w-md -translate-y-1/2 rounded-2xl bg-background p-6 shadow-lg focus:outline-none">
              <Dialog.Title className="text-lg font-semibold">
                Event Created Successfully!
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Your private event has been created. Share this code with people
                who should have access.
              </Dialog.Description>
              <div className="mt-4">
                <EventShareCode
                  shareCode={createdShareCode}
                  eventName={createdEventName}
                />
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  onClick={() => {
                    if (createdEventId) {
                      setCreatedShareCode(null);
                      setCreatedEventName(null);
                      setCreatedEventId(null);
                      router.push(
                        `/dashboard/photographer/events/${createdEventId}`,
                      );
                    }
                  }}
                  className="rounded-md"
                >
                  Go to Event
                </Button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  );
}
