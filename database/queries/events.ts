/**
 * Event-related database queries
 */

import type { SupabaseServerClient } from "./types";
import { getErrorMessage } from "./types";

export interface Event {
  id: string;
  user_id: string;
  name: string;
  date: string;
    city: string;
    country: string;
    state: string;
  activity: string;
  is_public: boolean;
  share_code: string | null;
  price_per_photo: number | null;
  watermark_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EventSummary {
  id: string;
  name: string;
  date: string;
    city: string;
    country: string;
    state: string;
  activity: string;
  is_public: boolean;
  share_code: string | null;
  price_per_photo: number | null;
  watermark_enabled: boolean;
}

/**
 * Get all events for a user
 */
export async function getUserEvents(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<EventSummary[]> {
  const { data, error } = await supabase
    .from("events")
    .select(
      "id, name, date, city, country, activity, is_public, share_code, price_per_photo, watermark_enabled",
    )
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .throwOnError();

  if (error) {
    throw new Error(`Failed to get user events: ${getErrorMessage(error)}`);
  }

  return (data ?? []) as EventSummary[];
}

/**
 * Get a single event by ID (with ownership check)
 */
export async function getEvent(
  supabase: SupabaseServerClient,
  eventId: string,
  userId: string,
): Promise<Event | null> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .eq("user_id", userId)
    .single()
    .throwOnError();

  if (error) {
    throw new Error(`Failed to get event: ${getErrorMessage(error)}`);
  }

  return data as Event | null;
}

/**
 * Check if an event exists and belongs to a user
 */
export async function eventExists(
  supabase: SupabaseServerClient,
  eventId: string,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

/**
 * Create a new event
 */
export async function createEvent(
  supabase: SupabaseServerClient,
  userId: string,
  eventData: {
    name: string;
    date: string;
    city: string;
    country: string;
    state: string;
    activity: string;
    is_public: boolean;
    share_code: string | null;
    price_per_photo: number | null;
    watermark_enabled: boolean;
  },
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("events")
    .insert({
      user_id: userId,
      ...eventData,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to create event: ${error ? getErrorMessage(error) : "Unknown error"}`,
    );
  }

  return { id: data.id };
}

/**
 * Get an event by share code (public access)
 */
export async function getEventByShareCode(
  supabase: SupabaseServerClient,
  shareCode: string,
): Promise<Event | null> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("share_code", shareCode)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Event;
}

/**
 * Search public events with filters
 */
export async function searchPublicEvents(
  supabase: SupabaseServerClient,
  filters: {
    searchText?: string;
    activities?: string[];
    cities?: string[];
    countries?: string[];
    sortBy?: "date_asc" | "date_desc" | "name_asc" | "name_desc";
    limit?: number;
    offset?: number;
  },
): Promise<{ events: EventSummary[]; total: number }> {
  let query = supabase
    .from("events")
    .select(
      "id, name, date, city, country, state, activity, is_public, share_code, price_per_photo, watermark_enabled",
      { count: "exact" },
    )
    .eq("is_public", true);

  // Text search on name, city, or country
  if (filters.searchText?.trim()) {
    const searchText = `%${filters.searchText.trim()}%`;
    query = query.or(
      `name.ilike.${searchText},city.ilike.${searchText},country.ilike.${searchText}`,
    );
  }

  // Activity filter
  if (filters.activities && filters.activities.length > 0) {
    query = query.in("activity", filters.activities);
  }

  // City filter
  if (filters.cities && filters.cities.length > 0) {
    query = query.in("city", filters.cities);
  }

  // Country filter
  if (filters.countries && filters.countries.length > 0) {
    query = query.in("country", filters.countries);
  }

  // Sort
  const sortBy = filters.sortBy || "date_desc";
  switch (sortBy) {
    case "date_asc":
      query = query.order("date", { ascending: true });
      break;
    case "date_desc":
      query = query.order("date", { ascending: false });
      break;
    case "name_asc":
      query = query.order("name", { ascending: true });
      break;
    case "name_desc":
      query = query.order("name", { ascending: false });
      break;
  }

  // Pagination
  const limit = filters.limit || 20;
  const offset = filters.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("Search events error:", error);
    throw new Error(`Failed to search events: ${getErrorMessage(error)}`);
  }

  console.log("Query result - events:", data?.length ?? 0, "count:", count);

  return {
    events: (data ?? []) as EventSummary[],
    total: count ?? 0,
  };
}

/**
 * Get unique values for filters (cities, countries)
 */
export async function getEventFilterOptions(
  supabase: SupabaseServerClient,
): Promise<{
  cities: string[];
  countries: string[];
}> {
  const { data, error } = await supabase
    .from("events")
    .select("city, country")
    .eq("is_public", true);

  if (error) {
    throw new Error(`Failed to get filter options: ${getErrorMessage(error)}`);
  }

  const cities = new Set<string>();
  const countries = new Set<string>();

  (data ?? []).forEach((event) => {
    if (event.city) cities.add(event.city);
    if (event.country) countries.add(event.country);
  });

  return {
    cities: Array.from(cities).sort(),
    countries: Array.from(countries).sort(),
  };
}

/**
 * Update an event
 */
export async function updateEvent(
  supabase: SupabaseServerClient,
  eventId: string,
  userId: string,
  eventData: {
    name?: string;
    date?: string;
    city?: string;
    country?: string;
    state?: string | null;
    activity?: string;
    is_public?: boolean;
    share_code?: string | null;
    price_per_photo?: number | null;
    watermark_enabled?: boolean;
  },
): Promise<void> {
  // Verify event belongs to user
  const exists = await eventExists(supabase, eventId, userId);
  if (!exists) {
    throw new Error("Event not found or access denied");
  }

  const { error } = await supabase
    .from("events")
    .update(eventData)
    .eq("id", eventId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to update event: ${getErrorMessage(error)}`);
  }
}

/**
 * Delete an event
 */
export async function deleteEvent(
  supabase: SupabaseServerClient,
  eventId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to delete event: ${getErrorMessage(error)}`);
  }
}
