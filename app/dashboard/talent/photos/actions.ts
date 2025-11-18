"use server";

import {
  createPhotoUrls,
  getTaggedPhotosCountForTalent,
  getTaggedPhotosForTalent,
  isPhotoInCart,
} from "@/database/queries";
import { createClient } from "@/database/server";
import { getBaseUrl } from "@/lib/get-base-url";

export interface TaggedPhotoGroup {
  event_id: string | null;
  event_name: string | null;
  event_date: string | null;
  event_city: string | null;
  event_country: string | null;
  event_watermark_enabled: boolean | null;
  dates: Array<{
    date: string;
    photos: Array<{
      photo_id: string;
      photo_url: string;
      signed_url: string | null;
      taken_at: string | null;
      tagged_at: string;
    }>;
  }>;
}

export interface ListMyTaggedPhotosResult {
  groups: TaggedPhotoGroup[];
  totalCount: number;
  hasMore: boolean;
  photosInCart: string[];
}

/**
 * List photos where the current user (talent) is tagged
 * Grouped by event and date
 */
export async function listMyTaggedPhotos(options?: {
  limit?: number;
  offset?: number;
}): Promise<ListMyTaggedPhotosResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to view your tagged photos.");
  }

  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  // Get tagged photos
  const taggedPhotos = await getTaggedPhotosForTalent(supabase, user.id, {
    limit,
    offset,
  });

  // Get total count
  const totalCount = await getTaggedPhotosCountForTalent(supabase, user.id);

  // Get all photo IDs to check which are in cart
  const allPhotoIds = taggedPhotos.map((p) => p.photo_id);
  const photosInCart: string[] = [];
  for (const photoId of allPhotoIds) {
    const inCart = await isPhotoInCart(supabase, user.id, photoId);
    if (inCart) {
      photosInCart.push(photoId);
    }
  }

  // Generate URLs for photos (with watermark if event has watermark enabled)
  const photoPaths = taggedPhotos
    .map((p) => p.photo_url)
    .filter((url): url is string => url !== null);

  const signedUrlsMap: Record<string, string | null> = {};
  if (photoPaths.length > 0) {
    // Group photos by watermark requirement
    const photosByWatermark = new Map<boolean, string[]>();
    for (const photo of taggedPhotos) {
      const needsWatermark = photo.event_watermark_enabled === true;
      const path = photo.photo_url;
      if (path) {
        const existing = photosByWatermark.get(needsWatermark) ?? [];
        existing.push(path);
        photosByWatermark.set(needsWatermark, existing);
      }
    }

    const baseUrl = await getBaseUrl();

    // Generate URLs for each group
    for (const [needsWatermark, paths] of photosByWatermark.entries()) {
      const photoUrls = await createPhotoUrls(supabase, "photos", paths, {
        expiresIn: 3600,
        useWatermark: needsWatermark,
        baseUrl,
      });
      for (const item of photoUrls) {
        signedUrlsMap[item.path] = item.signedUrl;
      }
    }
  }

  // Group by event and date
  const groupsMap = new Map<string, TaggedPhotoGroup>();

  for (const photo of taggedPhotos) {
    const eventKey = photo.event_id ?? "no-event";
    const eventName = photo.event_name ?? "Uncategorized";
    const eventDate = photo.event_date ?? null;
    const eventCity = photo.event_city ?? null;
    const eventCountry = photo.event_country ?? null;
    const eventWatermarkEnabled = photo.event_watermark_enabled ?? null;

    if (!groupsMap.has(eventKey)) {
      groupsMap.set(eventKey, {
        event_id: photo.event_id,
        event_name: eventName,
        event_date: eventDate,
        event_city: eventCity,
        event_country: eventCountry,
        event_watermark_enabled: eventWatermarkEnabled,
        dates: [],
      });
    }

    const group = groupsMap.get(eventKey) ?? {
      event_id: photo.event_id,
      event_name: eventName,
      event_date: eventDate,
      event_city: eventCity,
      event_country: eventCountry,
      event_watermark_enabled: eventWatermarkEnabled,
      dates: [],
    };

    const photoDate = photo.taken_at
      ? new Date(photo.taken_at).toISOString().split("T")[0]
      : "unknown";

    let dateGroup = group.dates.find((d) => d.date === photoDate);
    if (!dateGroup) {
      dateGroup = { date: photoDate, photos: [] };
      group.dates.push(dateGroup);
    }

    dateGroup.photos.push({
      photo_id: photo.photo_id,
      photo_url: photo.photo_url ?? "",
      signed_url: photo.photo_url
        ? (signedUrlsMap[photo.photo_url] ?? null)
        : null,
      taken_at: photo.taken_at,
      tagged_at: photo.tagged_at,
    });
  }

  // Sort dates within each event
  for (const group of groupsMap.values()) {
    group.dates.sort((a, b) => b.date.localeCompare(a.date));
    // Sort photos within each date by tagged_at
    for (const dateGroup of group.dates) {
      dateGroup.photos.sort(
        (a, b) =>
          new Date(b.tagged_at).getTime() - new Date(a.tagged_at).getTime(),
      );
    }
  }

  // Convert map to array and sort by event date
  const groups = Array.from(groupsMap.values()).sort((a, b) => {
    if (!a.event_date && !b.event_date) return 0;
    if (!a.event_date) return 1;
    if (!b.event_date) return -1;
    return new Date(b.event_date).getTime() - new Date(a.event_date).getTime();
  });

  return {
    groups,
    totalCount,
    hasMore: offset + taggedPhotos.length < totalCount,
    photosInCart,
  };
}
