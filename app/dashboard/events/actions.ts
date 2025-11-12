"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/database/server";
import {
  eventExists,
  getPhotoStoragePaths,
  deleteEventPhotos,
  deleteEvent,
  deleteStorageFiles,
  getPhoto,
  deletePhoto as dbDeletePhoto,
} from "@/database/queries";

export const deleteEventAction = async (eventId: string) => {
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

  if (!(await eventExists(supabase, eventId, user.id))) {
    throw new Error("Event not found.");
  }

  // Get storage paths before deleting photos
  const storagePaths = await getPhotoStoragePaths(supabase, eventId, user.id);

  // Delete photos from database
  await deleteEventPhotos(supabase, eventId, user.id);

  // Delete files from storage
  if (storagePaths.length > 0) {
    await deleteStorageFiles(supabase, "photos", storagePaths);
  }

  // Delete event
  await deleteEvent(supabase, eventId, user.id);

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

  const photo = await getPhoto(supabase, photoId, eventId, user.id);

  if (!photo) {
    throw new Error("Photo not found.");
  }

  // Delete photo from database
  await dbDeletePhoto(supabase, photoId, user.id);

  // Delete file from storage
  if (photo.original_url) {
    await deleteStorageFiles(supabase, "photos", [photo.original_url]);
  }

  revalidatePath("/dashboard/events");
  revalidatePath(`/dashboard/events/${eventId}`);
};
