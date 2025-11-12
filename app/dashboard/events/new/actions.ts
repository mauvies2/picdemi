"use server";

import { Buffer } from "node:buffer";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/database/server";
import {
  createEvent as dbCreateEvent,
  createPhoto,
  uploadFile,
  deleteEventPhotos,
  deleteStorageFiles,
  deleteEvent,
} from "@/database/queries";
import { activityValues } from "./activity-options";

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

type EventPayload = z.infer<typeof eventSchema>;

type CreateEventResult = {
  eventId: string;
};

export const createEvent = async (
  formData: FormData,
): Promise<CreateEventResult> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to create an event.");
  }

  const rawPayload: Record<string, FormDataEntryValue | null> = {
    name: formData.get("name"),
    activity: formData.get("activity"),
    date: formData.get("date"),
    country: formData.get("country"),
    city: formData.get("city"),
  };

  const parsed = eventSchema.safeParse({
    name: rawPayload.name?.toString() ?? "",
    activity: rawPayload.activity?.toString() ?? "",
    date: rawPayload.date?.toString() ?? "",
    country: rawPayload.country?.toString() ?? "",
    city: rawPayload.city?.toString() ?? "",
  });

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? "Invalid event data provided.",
    );
  }

  const payload: EventPayload = parsed.data;
  const uploadedFiles = formData
    .getAll("photos")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (uploadedFiles.length === 0) {
    throw new Error("Add at least one photo to continue.");
  }

  const event = await dbCreateEvent(supabase, user.id, {
    name: payload.name,
    activity: payload.activity,
    date: payload.date,
    country: payload.country,
    city: payload.city,
  });

  const photoRecords: { original_path: string }[] = [];

  try {
    for (const file of uploadedFiles) {
      const fileId = crypto.randomUUID();
      const extension = file.name.split(".").pop();
      const safeName = extension
        ? `${fileId}.${extension.toLowerCase()}`
        : `${fileId}`;
      const path = `${user.id}/${event.id}/${safeName}`;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await uploadFile(supabase, "photos", path, buffer, {
        contentType: file.type || undefined,
        upsert: false,
      });

      await createPhoto(supabase, user.id, {
        event_id: event.id,
        original_url: path,
        taken_at: new Date(payload.date).toISOString(),
        city: payload.city,
        country: payload.country,
      });

      photoRecords.push({ original_path: path });
    }
  } catch (error) {
    console.error("createEvent: upload failed", error);
    await deleteEventPhotos(supabase, event.id, user.id);
    await deleteStorageFiles(supabase, "photos", photoRecords.map((record) => record.original_path));
    await deleteEvent(supabase, event.id, user.id);

    const message =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null
          ? JSON.stringify(error)
          : "Unable to upload photos. Please try again.";
    throw new Error(message);
  }

  revalidatePath("/dashboard/events");
  revalidatePath(`/dashboard/events/${event.id}`);

  return { eventId: event.id };
};
