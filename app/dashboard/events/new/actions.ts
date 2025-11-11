"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { createClient } from "@/database/server";

export const createUploadUrls = async (input: unknown) => {
  const schema = z.object({
    files: z
      .array(
        z.object({
          name: z.string().min(1),
          type: z.string().min(1),
          size: z.number().int().positive(),
        }),
      )
      .min(1),
  });
  const { files } = schema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Create a batch
  const { data: batch } = await supabase
    .from("upload_batches")
    .insert({ user_id: user.id, status: "PENDING" })
    .select()
    .single()
    .throwOnError();

  // We will upload from the client with authenticated supabase client.
  // Return storage paths per file that the client should use.
  const prefix = `${user.id}/${batch.id}`;
  const targets = files.map((f) => ({
    name: f.name,
    type: f.type,
    size: f.size,
    path: `${prefix}/${encodeURIComponent(f.name)}`,
  }));

  return { batchId: batch.id, targets };
};

export const completeUploadBatch = async (input: unknown) => {
  const schema = z.object({
    batchId: z.uuid(),
    objects: z
      .array(
        z.object({
          path: z.string().min(1),
          size: z.number().int().nonnegative(),
          contentType: z.string().optional().nullable(),
        }),
      )
      .min(1),
  });
  const { batchId, objects } = schema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Insert objects
  await supabase
    .from("upload_objects")
    .insert(
      objects.map((o) => ({
        batch_id: batchId,
        storage_path: o.path,
        size_bytes: o.size,
        content_type: o.contentType ?? null,
      })),
    )
    .throwOnError();

  // Flip batch to PROCESSING
  await supabase
    .from("upload_batches")
    .update({ status: "PROCESSING" })
    .eq("id", batchId)
    .eq("user_id", user.id);

  // Start extraction (simplified for MVP)
  await extractMetadata({ batchId });

  return { batchId };
};

export const getBatchStatus = async (input: unknown) => {
  const schema = z.object({ batchId: z.uuid() });
  const { batchId } = schema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: batch } = await supabase
    .from("upload_batches")
    .select("*")
    .eq("id", batchId)
    .eq("user_id", user.id)
    .single()
    .throwOnError();

  const { data: objects } = await supabase
    .from("upload_objects")
    .select("id, storage_path, created_at")
    .eq("batch_id", batchId)
    .throwOnError();

  const total = objects?.length ?? 0;
  // In this MVP we consider all extracted after PROCESSING->DONE
  const status = batch?.status ?? "PENDING";
  const extractedCount =
    status === "DONE"
      ? total
      : status === "PROCESSING"
        ? Math.floor(total / 2)
        : 0;

  return {
    status,
    extractedCount,
    total,
    stats: {
      withGps: 0,
      withoutGps: total,
      withDate: total,
    },
    suggested: {
      date: batch?.suggested_date ?? null,
      timeStart: batch?.suggested_time_start ?? null,
      timeEnd: batch?.suggested_time_end ?? null,
      city: batch?.suggested_city ?? null,
      province: batch?.suggested_province ?? null,
      country: batch?.suggested_country ?? null,
    },
  } as {
    status: string;
    extractedCount: number;
    total: number;
    stats: { withGps: number; withoutGps: number; withDate: number };
    suggested: {
      date: string | null;
      timeStart: string | null;
      timeEnd: string | null;
      city: string | null;
      province: string | null;
      country: string | null;
    };
  };
};

export const extractMetadata = async (input: unknown) => {
  const schema = z.object({ batchId: z.uuid() });
  const { batchId } = schema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Simplified MVP: infer suggested date/time from object created_at
  const { data: objects } = await supabase
    .from("upload_objects")
    .select("id, created_at, storage_path")
    .eq("batch_id", batchId)
    .throwOnError();

  const times = (objects ?? []).map((o) => new Date(o.created_at).getTime());
  const minT = times.length ? new Date(Math.min(...times)) : new Date();
  const maxT = times.length ? new Date(Math.max(...times)) : new Date();
  const suggestedDate = new Date(minT.toISOString().slice(0, 10));

  // Create photo rows (MVP: original_url is storage_path; signed URL will be generated later)
  if (objects && objects.length > 0) {
    await supabase
      .from("photos")
      .insert(
        objects.map((o) => ({
          user_id: user.id,
          upload_object_id: o.id,
          original_url: o.storage_path,
          taken_at: new Date(o.created_at).toISOString(),
        })),
      )
      .throwOnError();
  }

  await supabase
    .from("upload_batches")
    .update({
      status: "DONE",
      suggested_date: suggestedDate.toISOString().slice(0, 10),
      suggested_time_start: minT.toISOString(),
      suggested_time_end: maxT.toISOString(),
    })
    .eq("id", batchId)
    .eq("user_id", user.id)
    .throwOnError();

  revalidateTag(`batch:${batchId}`, { expire: 60 * 60 * 24 });
  return { ok: true };
};

export const createEventFromBatch = async (input: unknown) => {
  const schema = z.object({
    batchId: z.uuid(),
    name: z.string().min(1),
    date: z.string().min(1),
    timeStart: z.string().nullish(),
    timeEnd: z.string().nullish(),
    city: z.string().nullish(),
    province: z.string().nullish(),
    countryCode: z.string().nullish(),
    activity: z.enum([
      "SURF",
      "MTB",
      "SKATEBOARDING",
      "RUNNING_ROAD",
      "RUNNING_TRAIL",
      "CYCLING_ROAD",
      "CYCLING_GRAVEL",
      "BMX",
      "TRIATHLON",
      "OPEN_WATER_SWIMMING",
      "SKI_ALPINE",
      "SNOWBOARD",
      "SKI_CROSS_COUNTRY",
      "CLIMBING_BOULDER",
      "HIKING",
      "OTHER",
    ]),
  });
  const payload = schema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Create event
  const { data: event } = await supabase
    .from("events")
    .insert({
      user_id: user.id,
      name: payload.name,
      date: payload.date,
      time_start: payload.timeStart ?? null,
      time_end: payload.timeEnd ?? null,
      city: payload.city ?? null,
      province: payload.province ?? null,
      country_code: payload.countryCode ?? null,
      activity: payload.activity,
    })
    .select()
    .single()
    .throwOnError();

  // Backfill photos from batch -> link to event
  const { data: objs } = await supabase
    .from("upload_objects")
    .select("id")
    .eq("batch_id", payload.batchId)
    .throwOnError();

  if (objs && objs.length > 0) {
    const ids = objs.map((o) => o.id);
    // Update photos in place
    await supabase
      .from("photos")
      .update({
        event_id: event.id,
        city: payload.city ?? undefined,
        province: payload.province ?? undefined,
        country_code: payload.countryCode ?? undefined,
      })
      .in("upload_object_id", ids)
      .eq("user_id", user.id)
      .throwOnError();
  }

  revalidatePath("/dashboard/events");
  revalidatePath(`/dashboard/events/${event.id}`);
  return { eventId: event.id };
};

export const generateThumbnails = async (_photoIds: string[]) => {
  // TODO: implement in a background worker using sharp. This is a stub.
  return { queued: _photoIds.length };
};
