"use server";

import {
  createSignedUrls,
  getTaggedPhotosCountForTalent,
  getTaggedPhotosForTalent,
} from "@/database/queries";
import { createClient } from "@/database/server";

export interface TaggedPhotoGroup {
  event_id: string | null;
  event_name: string | null;
  event_date: string | null;
  event_city: string | null;
  event_country: string | null;
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

  // Generate signed URLs for photos
  const photoPaths = taggedPhotos
    .map((p) => p.photo_url)
    .filter((url): url is string => url !== null);

  const signedUrlsMap: Record<string, string | null> = {};
  if (photoPaths.length > 0) {
    const signedUrls = await createSignedUrls(
      supabase,
      "photos",
      photoPaths,
      3600,
    );
    for (const item of signedUrls) {
      signedUrlsMap[item.path] = item.signedUrl;
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

    if (!groupsMap.has(eventKey)) {
      groupsMap.set(eventKey, {
        event_id: photo.event_id,
        event_name: eventName,
        event_date: eventDate,
        event_city: eventCity,
        event_country: eventCountry,
        dates: [],
      });
    }

    const group = groupsMap.get(eventKey) ?? {
      event_id: photo.event_id,
      event_name: eventName,
      event_date: eventDate,
      event_city: eventCity,
      event_country: eventCountry,
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
  };
}
