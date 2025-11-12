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
  activity: string;
  created_at?: string;
  updated_at?: string;
}

export interface EventSummary {
  id: string;
  name: string;
  date: string;
  city: string;
  country: string;
  activity: string;
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
    .select("id, name, date, city, country, activity")
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
    activity: string;
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

