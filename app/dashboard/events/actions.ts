"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/database/server";

export const deleteEvent = async (eventId: string) => {
  if (!eventId) {
    throw new Error("Event id is required.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to delete an event.");
  }

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("user_id", user.id)
    .single();

  if (!event) {
    throw new Error("Event not found.");
  }

  const { data: photos } = await supabase
    .from("photos")
    .select("original_url")
    .eq("event_id", eventId)
    .eq("user_id", user.id);

  const storagePaths = (photos ?? [])
    .map((photo) => photo.original_url)
    .filter(
      (path): path is string => typeof path === "string" && path.length > 0,
    );

  const { error: photosDeleteError } = await supabase
    .from("photos")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", user.id);

  if (photosDeleteError) {
    throw new Error(photosDeleteError.message);
  }

  if (storagePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from("photos")
      .remove(storagePaths);

    if (storageError) {
      throw new Error(storageError.message);
    }
  }

  const { error: eventDeleteError } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId)
    .eq("user_id", user.id);

  if (eventDeleteError) {
    throw new Error(eventDeleteError.message);
  }

  revalidatePath("/dashboard/events");
  revalidatePath(`/dashboard/events/${eventId}`);
};

export const deletePhoto = async (photoId: string, eventId: string) => {
  if (!photoId) {
    throw new Error("Photo id is required.");
  }
  if (!eventId) {
    throw new Error("Event id is required.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to delete a photo.");
  }

  const { data: photo } = await supabase
    .from("photos")
    .select("id, original_url")
    .eq("id", photoId)
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .single();

  if (!photo) {
    throw new Error("Photo not found.");
  }

  const { error: deletePhotoError } = await supabase
    .from("photos")
    .delete()
    .eq("id", photoId)
    .eq("user_id", user.id);

  if (deletePhotoError) {
    throw new Error(deletePhotoError.message);
  }

  if (photo.original_url) {
    const { error: storageError } = await supabase.storage
      .from("photos")
      .remove([photo.original_url]);

    if (storageError) {
      throw new Error(storageError.message);
    }
  }

  revalidatePath("/dashboard/events");
  revalidatePath(`/dashboard/events/${eventId}`);
};
