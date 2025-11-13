"use server";

import {
  getEventFilterOptions,
  searchPublicEvents,
} from "@/database/queries";
import { createClient } from "@/database/server";
import { createSignedUrl, getPhotosForEvents } from "@/database/queries";

export async function searchEventsAction(filters: {
  searchText?: string;
  activities?: string[];
  cities?: string[];
  countries?: string[];
  sortBy?: "date_asc" | "date_desc" | "name_asc" | "name_desc";
  limit?: number;
  offset?: number;
}) {
  const supabase = await createClient();
  const result = await searchPublicEvents(supabase, filters);
  
  // Debug logging
  console.log("Search filters:", filters);
  console.log("Found events:", result.events.length, "Total:", result.total);

  // Get cover photos for events
  const eventIds = result.events.map((e) => e.id);
  const photoRows = await getPhotosForEvents(supabase, eventIds);

  const stats = new Map<
    string,
    {
      count: number;
      coverPath: string | null;
    }
  >();

  (photoRows ?? []).forEach((row) => {
    if (!row.event_id) return;
    const current = stats.get(row.event_id) ?? {
      count: 0,
      coverPath: null,
    };
    current.count += 1;
    if (!current.coverPath && row.original_url) {
      current.coverPath = row.original_url;
    }
    stats.set(row.event_id, current);
  });

  // Sign cover URLs
  const coverUrls = new Map<string, string>();
  await Promise.all(
    Array.from(stats.entries()).map(async ([eventId, info]) => {
      if (!info.coverPath) return;
      const signedUrl = await createSignedUrl(
        supabase,
        "photos",
        info.coverPath,
        60 * 60,
      );
      if (signedUrl) coverUrls.set(eventId, signedUrl);
    }),
  );

  return {
    events: result.events.map((event) => ({
      ...event,
      photoCount: stats.get(event.id)?.count ?? 0,
      coverUrl: coverUrls.get(event.id) ?? null,
    })),
    total: result.total,
  };
}

export async function getFilterOptionsAction() {
  const supabase = await createClient();
  return await getEventFilterOptions(supabase);
}

