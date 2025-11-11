"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "@tanstack/react-form";
import { format } from "date-fns";
import { ChevronDownIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState, useTransition } from "react";
import { z } from "zod";
import { DashboardHeader } from "@/components/dashboard-header";
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
  city: z.string().trim().min(1, "City is required."),
});

type FormValues = z.infer<typeof eventSchema>;

const defaultValues: FormValues = {
  name: "",
  activity: "",
  date: "",
  country: "",
  city: "",
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"] as const;
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
};

export default function NewEventForm() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null);
  const [photosError, setPhotosError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const dateInputId = useId();
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

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

  const removeFile = (target: File) => {
    setFiles((prev) => prev.filter((file) => file !== target));
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
    formData.append("city", value.city.trim());
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
        router.push(`/dashboard/events/${result.eventId}`);
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
      { label: "Country", value: source.country },
      { label: "City", value: source.city },
      { label: "Photos", value: `${files.length} selected` },
    ];
  }, [pendingValues, form.state.values, files.length]);

  return (
    <div className="p-4">
      <div className="mx-auto w-full space-y-6">
        <header>
          <DashboardHeader title="Create Event" />
          <p className="mt-1 text-sm text-muted-foreground">
            Fill the details and add your photos.
          </p>
        </header>

        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <form
            className="flex flex-col gap-6"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitAttempted(true);
              form.handleSubmit();
            }}
            noValidate
          >
            <div className="grid gap-4">
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
                    <div className="grid gap-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={field.state.value}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                        onBlur={field.handleBlur}
                        placeholder="Event name"
                        aria-invalid={isInvalid}
                        autoComplete="off"
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
                      />
                      {isInvalid && error ? (
                        <p className="text-xs text-destructive">{error}</p>
                      ) : null}
                    </div>
                  );
                }}
              </form.Field>

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
                      />
                      {isInvalid && error ? (
                        <p className="text-xs text-destructive">{error}</p>
                      ) : null}
                    </div>
                  );
                }}
              </form.Field>
            </div>

            <div className="grid gap-2">
              <Label>Photos</Label>
              <Dropzone accept=".jpg,.jpeg,.png,.heic" onSelect={handleFiles} />
              {files.length > 0 && (
                <div className="rounded-xl border border-dashed border-muted-foreground/30 p-4">
                  <ul className="grid gap-2">
                    {files.map((file) => (
                      <li
                        key={`${file.name}-${file.lastModified}`}
                        className="flex items-center justify-between gap-3 rounded-lg border border-transparent px-3 py-2 transition-colors hover:border-muted-foreground/30"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatBytes(file.size)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          aria-label={`Remove ${file.name}`}
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {photosError ? (
                <p className="text-sm text-destructive">{photosError}</p>
              ) : null}
            </div>

            <div className="mt-auto flex flex-col items-end gap-3 sm:flex-row sm:items-center sm:justify-end">
              {submitError ? (
                <p className="text-sm text-destructive text-right sm:text-left">
                  {submitError}
                </p>
              ) : null}
              <Button type="submit" disabled={isPending}>
                Create Event
              </Button>
            </div>
          </form>
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
                {isPending ? "Creating..." : "Confirm"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
