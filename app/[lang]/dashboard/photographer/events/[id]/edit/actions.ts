'use server';

import { Buffer } from 'node:buffer';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { activityValues } from '@/app/[lang]/dashboard/photographer/events/new/activity-options';
import {
  createPhoto,
  deletePhoto as dbDeletePhoto,
  deleteStorageFiles,
  eventExists,
  getPhoto,
  updateEvent,
  uploadFile,
} from '@/database/queries';
import { createClient } from '@/database/server';

const eventSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  activity: z
    .string()
    .min(1, 'Activity is required.')
    .refine(
      (value): value is (typeof activityValues)[number] =>
        activityValues.includes(value as (typeof activityValues)[number]),
      'Activity is required.',
    ),
  date: z.string().min(1, 'Date is required.'),
  country: z.string().trim().min(1, 'Country is required.'),
  state: z.string().trim().min(1, 'State/Province is required.'),
  city: z.string().trim().optional(),
  is_public: z
    .string()
    .default('true')
    .transform((val) => val === 'true'),
  watermark_enabled: z
    .string()
    .default('true')
    .transform((val) => val === 'true'),
  price_per_photo: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val.trim() === '') return null;
      const num = Number.parseFloat(val);
      return Number.isNaN(num) || num < 0 ? null : num;
    }),
});

type EventPayload = z.infer<typeof eventSchema>;

export async function updateEventAction(
  eventId: string,
  formData: FormData,
  photoFormData?: FormData,
  photoIdsToDelete?: string[],
): Promise<{ success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('You must be signed in to update an event.');
  }

  const rawPayload: Record<string, FormDataEntryValue | null> = {
    name: formData.get('name'),
    activity: formData.get('activity'),
    date: formData.get('date'),
    country: formData.get('country'),
    state: formData.get('state'),
    city: formData.get('city'),
    is_public: formData.get('is_public'),
    watermark_enabled: formData.get('watermark_enabled'),
    price_per_photo: formData.get('price_per_photo'),
  };

  const parsed = eventSchema.safeParse({
    name: rawPayload.name?.toString() ?? '',
    activity: rawPayload.activity?.toString() ?? '',
    date: rawPayload.date?.toString() ?? '',
    country: rawPayload.country?.toString() ?? '',
    state: rawPayload.state?.toString(),
    city: rawPayload.city?.toString(),
    is_public: rawPayload.is_public?.toString() ?? 'true',
    watermark_enabled: rawPayload.watermark_enabled?.toString() ?? 'true',
    price_per_photo: rawPayload.price_per_photo?.toString(),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid event data provided.');
  }

  const payload: EventPayload = parsed.data;

  // Get current event to check if privacy changed
  const { getEvent } = await import('@/database/queries');
  const currentEvent = await getEvent(supabase, eventId, user.id);

  if (!currentEvent) {
    throw new Error('Event not found.');
  }

  // Handle share code: generate if switching from public to private, keep if already private
  let shareCode: string | null = currentEvent.share_code;
  if (!payload.is_public && !shareCode) {
    // Generate a random 8-character alphanumeric code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding ambiguous chars
    shareCode = Array.from({ length: 8 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length)),
    ).join('');
  } else if (payload.is_public) {
    // Remove share code if switching to public
    shareCode = null;
  }

  // Watermark only applies to public events
  const watermarkEnabled = payload.is_public && payload.watermark_enabled;

  await updateEvent(supabase, eventId, user.id, {
    name: payload.name,
    activity: payload.activity,
    date: payload.date,
    country: payload.country,
    state: payload.state,
    city: payload.city || '',
    is_public: payload.is_public,
    share_code: shareCode,
    price_per_photo: payload.price_per_photo ?? null,
    watermark_enabled: watermarkEnabled,
  });

  // Delete photos if any
  if (photoIdsToDelete && photoIdsToDelete.length > 0) {
    for (const photoId of photoIdsToDelete) {
      const photo = await getPhoto(supabase, photoId, eventId, user.id);
      if (photo) {
        await dbDeletePhoto(supabase, photoId, user.id);
        if (photo.original_url) {
          await deleteStorageFiles(supabase, 'photos', [photo.original_url]);
        }
      }
    }
  }

  // Add new photos if any
  if (photoFormData) {
    const uploadedFiles = photoFormData
      .getAll('photos')
      .filter((value): value is File => value instanceof File && value.size > 0);

    if (uploadedFiles.length > 0) {
      const photoRecords: { original_path: string }[] = [];

      try {
        for (const file of uploadedFiles) {
          const fileId = crypto.randomUUID();
          const extension = file.name.split('.').pop();
          const safeName = extension ? `${fileId}.${extension.toLowerCase()}` : `${fileId}`;
          const path = `${user.id}/${currentEvent.id}/${safeName}`;
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          await uploadFile(supabase, 'photos', path, buffer, {
            contentType: file.type || undefined,
            upsert: false,
          });

          await createPhoto(supabase, user.id, {
            event_id: currentEvent.id,
            original_url: path,
            taken_at: new Date(payload.date).toISOString(),
            city: payload.city || '',
            country: payload.country,
            state: payload.state,
          });

          photoRecords.push({ original_path: path });
        }
      } catch (error) {
        console.error('updateEventAction: photo upload failed', error);
        // Clean up any uploaded files if photo creation fails
        if (photoRecords.length > 0) {
          await deleteStorageFiles(
            supabase,
            'photos',
            photoRecords.map((record) => record.original_path),
          );
        }
        throw error;
      }
    }
  }

  revalidatePath('/es/dashboard/photographer/events');
  revalidatePath('/en/dashboard/photographer/events');
  revalidatePath(`/es/dashboard/photographer/events/${eventId}`);
  revalidatePath(`/en/dashboard/photographer/events/${eventId}`);
  revalidatePath(`/es/dashboard/photographer/events/${eventId}/edit`);
  revalidatePath(`/en/dashboard/photographer/events/${eventId}/edit`);

  return { success: true };
}

/**
 * Delete a photo from an event
 */
export async function deletePhotoAction(photoId: string, eventId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('You must be signed in to delete a photo.');
  }

  // Verify event belongs to user
  if (!(await eventExists(supabase, eventId, user.id))) {
    throw new Error('Event not found or access denied.');
  }

  const photo = await getPhoto(supabase, photoId, eventId, user.id);

  if (!photo) {
    throw new Error('Photo not found.');
  }

  // Delete photo from database
  await dbDeletePhoto(supabase, photoId, user.id);

  // Delete file from storage
  if (photo.original_url) {
    await deleteStorageFiles(supabase, 'photos', [photo.original_url]);
  }

  revalidatePath('/es/dashboard/photographer/events');
  revalidatePath('/en/dashboard/photographer/events');
  revalidatePath(`/es/dashboard/photographer/events/${eventId}`);
  revalidatePath(`/en/dashboard/photographer/events/${eventId}`);
  revalidatePath(`/es/dashboard/photographer/events/${eventId}/edit`);
  revalidatePath(`/en/dashboard/photographer/events/${eventId}/edit`);
}

/**
 * Add photos to an existing event
 */
export async function addPhotosAction(eventId: string, formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('You must be signed in to add photos.');
  }

  // Verify event belongs to user
  const { getEvent } = await import('@/database/queries');
  const event = await getEvent(supabase, eventId, user.id);

  if (!event) {
    throw new Error('Event not found or access denied.');
  }

  const uploadedFiles = formData
    .getAll('photos')
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (uploadedFiles.length === 0) {
    throw new Error('No photos provided.');
  }

  const photoRecords: { original_path: string }[] = [];

  try {
    for (const file of uploadedFiles) {
      const fileId = crypto.randomUUID();
      const extension = file.name.split('.').pop();
      const safeName = extension ? `${fileId}.${extension.toLowerCase()}` : `${fileId}`;
      const path = `${user.id}/${event.id}/${safeName}`;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await uploadFile(supabase, 'photos', path, buffer, {
        contentType: file.type || undefined,
        upsert: false,
      });

      await createPhoto(supabase, user.id, {
        event_id: event.id,
        original_url: path,
        taken_at: new Date(event.date).toISOString(),
        city: event.city,
        country: event.country,
        state: event.state || '',
      });

      photoRecords.push({ original_path: path });
    }
  } catch (error) {
    console.error('addPhotosAction: upload failed', error);
    // Clean up any uploaded files if photo creation fails
    if (photoRecords.length > 0) {
      await deleteStorageFiles(
        supabase,
        'photos',
        photoRecords.map((record) => record.original_path),
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null
          ? JSON.stringify(error)
          : 'Unable to upload photos. Please try again.';
    throw new Error(message);
  }

  revalidatePath('/es/dashboard/photographer/events');
  revalidatePath('/en/dashboard/photographer/events');
  revalidatePath(`/es/dashboard/photographer/events/${eventId}`);
  revalidatePath(`/en/dashboard/photographer/events/${eventId}`);
  revalidatePath(`/es/dashboard/photographer/events/${eventId}/edit`);
  revalidatePath(`/en/dashboard/photographer/events/${eventId}/edit`);
}
