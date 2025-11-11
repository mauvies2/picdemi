"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { z } from "zod";
import { DashboardHeader } from "@/components/dashboard-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dropzone } from "@/components/uploader/Dropzone";
import { createEvent } from "./actions";
import { activityOptions, activityValues } from "./activity-options";

const eventSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  activity: z
    .string()
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
type FormErrors = Partial<Record<keyof FormValues, string>>;

type FormState = {
  name: string;
  activity: string;
  date: string;
  country: string;
  city: string;
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
};

export default function NewEventForm() {
  const router = useRouter();
  const [values, setValues] = useState<FormState>({
    name: "",
    activity: "",
    date: "",
    country: "",
    city: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [files, setFiles] = useState<File[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleFieldChange =
    (field: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = event.target.value;
      setValues((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

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
        if (!exists) {
          next.push(file);
        }
      }
      return next;
    });
  };

  const removeFile = (target: File) => {
    setFiles((prev) => prev.filter((file) => file !== target));
  };

  const validateForm = (form: FormState) => {
    const payload = {
      ...form,
      name: form.name.trim(),
      country: form.country.trim(),
      city: form.city.trim(),
    } satisfies FormState;
    const result = eventSchema.safeParse(payload);
    if (result.success) {
      setErrors({});
      return result.data;
    }
    const fieldErrors: FormErrors = {};
    for (const issue of result.error.issues) {
      if (issue.path[0]) {
        fieldErrors[issue.path[0] as keyof FormValues] = issue.message;
      }
    }
    setErrors(fieldErrors);
    return null;
  };

  const openConfirmation = () => {
    const parsed = validateForm(values);
    if (!parsed) return;
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const confirmCreation = () => {
    const parsed = validateForm(values);
    if (!parsed) return;
    const payload = parsed;
    const formData = new FormData();
    formData.append("name", payload.name.trim());
    formData.append("activity", payload.activity);
    formData.append("date", payload.date);
    formData.append("country", payload.country.trim());
    formData.append("city", payload.city.trim());
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

  const eventSummary = useMemo(
    () => [
      { label: "Name", value: values.name },
      {
        label: "Activity",
        value:
          activityOptions.find((option) => option.value === values.activity)
            ?.label ?? values.activity,
      },
      {
        label: "Date",
        value: values.date ? new Date(values.date).toLocaleDateString() : "",
      },
      { label: "Country", value: values.country },
      { label: "City", value: values.city },
      { label: "Photos", value: `${files.length} selected` },
    ],
    [values, files.length],
  );

  return (
    <div className="px-4 py-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header>
          <DashboardHeader title="Create Event" />
          <p className="mt-1 text-sm text-muted-foreground">
            Fill the details and add your photos.
          </p>
        </header>

        <section className="grid gap-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={values.name}
                onChange={handleFieldChange("name")}
                placeholder="Event name"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "name-error" : undefined}
              />
              {errors.name && (
                <p id="name-error" className="text-xs text-destructive">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="activity">Activity</Label>
              <select
                id="activity"
                value={values.activity}
                onChange={handleFieldChange("activity")}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-invalid:border-destructive"
                aria-invalid={Boolean(errors.activity)}
                aria-describedby={
                  errors.activity ? "activity-error" : undefined
                }
              >
                <option value="" disabled hidden>
                  Select an activity
                </option>
                {activityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.activity && (
                <p id="activity-error" className="text-xs text-destructive">
                  {errors.activity}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={values.date}
                onChange={handleFieldChange("date")}
                aria-invalid={Boolean(errors.date)}
                aria-describedby={errors.date ? "date-error" : undefined}
              />
              {errors.date && (
                <p id="date-error" className="text-xs text-destructive">
                  {errors.date}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={values.country}
                onChange={handleFieldChange("country")}
                placeholder="Country"
                aria-invalid={Boolean(errors.country)}
                aria-describedby={errors.country ? "country-error" : undefined}
              />
              {errors.country && (
                <p id="country-error" className="text-xs text-destructive">
                  {errors.country}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={values.city}
                onChange={handleFieldChange("city")}
                placeholder="City"
                aria-invalid={Boolean(errors.city)}
                aria-describedby={errors.city ? "city-error" : undefined}
              />
              {errors.city && (
                <p id="city-error" className="text-xs text-destructive">
                  {errors.city}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4">
            <Label>Photos</Label>
            <Dropzone accept=".jpg,.jpeg,.png,.heic" onSelect={handleFiles} />
            {files.length > 0 && (
              <ul className="grid gap-2 rounded-xl border border-dashed border-muted-foreground/30 p-4">
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
            )}
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {submitError && (
            <p className="text-sm text-destructive">{submitError}</p>
          )}
          <Button
            type="button"
            onClick={openConfirmation}
            className="sm:ml-auto"
            disabled={isPending}
          >
            Create Event
          </Button>
        </div>
      </div>

      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40" />
          <Dialog.Content className="fixed inset-x-4 top-1/2 z-50 mx-auto w-full max-w-md -translate-y-1/2 rounded-2xl bg-background p-6 shadow-lg focus:outline-none">
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
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                type="button"
                onClick={confirmCreation}
                disabled={isPending}
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
