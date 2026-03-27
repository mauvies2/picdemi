/**
 * Photo-related database queries
 */

import type { SupabaseServerClient } from './types';
import { getErrorMessage } from './types';

export interface Photo {
  id: string;
  user_id: string;
  event_id: string | null;
  original_url: string | null;
  taken_at: string | null;
  corrected_taken_at?: string | null;
  city?: string | null;
  country?: string | null;
  state?: string | null;
  created_at?: string;
}

export interface PhotoSummary {
  event_id: string | null;
  original_url: string | null;
  taken_at: string | null;
}

export interface PhotoDetail {
  id: string;
  original_url: string | null;
  taken_at: string | null;
  corrected_taken_at?: string | null;
  city: string | null;
  country: string | null;
  state: string | null;
}

/**
 * Get photos for multiple events
 */
export async function getPhotosForEvents(
  supabase: SupabaseServerClient,
  eventIds: string[],
): Promise<PhotoSummary[]> {
  if (eventIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('photos')
    .select('event_id, original_url, taken_at')
    .in('event_id', eventIds)
    .order('taken_at', { ascending: true })
    .throwOnError();

  if (error) {
    throw new Error(`Failed to get photos for events: ${getErrorMessage(error)}`);
  }

  return (data ?? []) as PhotoSummary[];
}

/**
 * Get photos for a single event
 */
export async function getEventPhotos(
  supabase: SupabaseServerClient,
  eventId: string,
  userId: string,
): Promise<PhotoDetail[]> {
  const { data, error } = await supabase
    .from('photos')
    .select('id, original_url, taken_at, city, country')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .order('taken_at', { ascending: true })
    .throwOnError();

  if (error) {
    throw new Error(`Failed to get event photos: ${getErrorMessage(error)}`);
  }

  return (data ?? []) as PhotoDetail[];
}

/**
 * Get photos for an event by event ID (public access, no user check)
 */
export async function getEventPhotosPublic(
  supabase: SupabaseServerClient,
  eventId: string,
): Promise<PhotoDetail[]> {
  const { data, error } = await supabase
    .from('photos')
    .select('id, original_url, taken_at, city, country')
    .eq('event_id', eventId)
    .order('taken_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to get event photos: ${getErrorMessage(error)}`);
  }

  return (data ?? []) as PhotoDetail[];
}

/**
 * Get photo storage paths for an event
 */
export async function getPhotoStoragePaths(
  supabase: SupabaseServerClient,
  eventId: string,
  userId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from('photos')
    .select('original_url')
    .eq('event_id', eventId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to get photo storage paths: ${getErrorMessage(error)}`);
  }

  return (data ?? [])
    .map((photo) => photo.original_url)
    .filter((path): path is string => typeof path === 'string' && path.length > 0);
}

/**
 * Get a single photo by ID
 */
export async function getPhoto(
  supabase: SupabaseServerClient,
  photoId: string,
  eventId: string,
  userId: string,
): Promise<Photo | null> {
  const { data, error } = await supabase
    .from('photos')
    .select('id, original_url')
    .eq('id', photoId)
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Photo | null;
}

/**
 * Create a photo record
 */
export async function createPhoto(
  supabase: SupabaseServerClient,
  userId: string,
  photoData: {
    event_id: string;
    original_url: string;
    taken_at: string | null;
    corrected_taken_at?: string | null;
    city: string;
    country: string;
    state: string | null;
  },
): Promise<void> {
  const { error } = await supabase.from('photos').insert({
    user_id: userId,
    ...photoData,
  });

  if (error) {
    throw new Error(`Failed to create photo: ${getErrorMessage(error)}`);
  }
}

/**
 * Get the min/max corrected_taken_at for an event's photos.
 * Used to determine the range for the time filter slider.
 */
export async function getPhotoTimeRange(
  supabase: SupabaseServerClient,
  eventId: string,
): Promise<{ min: string | null; max: string | null }> {
  const { data, error } = await supabase
    .from('photos')
    .select('corrected_taken_at')
    .eq('event_id', eventId)
    .not('corrected_taken_at', 'is', null)
    .order('corrected_taken_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to get photo time range: ${getErrorMessage(error)}`);
  }

  const times = (data ?? [])
    .map((p) => p.corrected_taken_at as string | null)
    .filter((t): t is string => t !== null);

  return {
    min: times[0] ?? null,
    max: times[times.length - 1] ?? null,
  };
}

/**
 * Get photos for an event with optional time range filtering on corrected_taken_at.
 */
export async function getEventPhotosFiltered(
  supabase: SupabaseServerClient,
  eventId: string,
  startTime?: string,
  endTime?: string,
): Promise<PhotoDetail[]> {
  let query = supabase
    .from('photos')
    .select('id, original_url, taken_at, corrected_taken_at, city, country')
    .eq('event_id', eventId);

  if (startTime) {
    query = query.gte('corrected_taken_at', startTime);
  }
  if (endTime) {
    query = query.lte('corrected_taken_at', endTime);
  }

  query = query.order('corrected_taken_at', { ascending: true, nullsFirst: false });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get filtered event photos: ${getErrorMessage(error)}`);
  }

  return (data ?? []) as PhotoDetail[];
}

/**
 * Batch update corrected_taken_at for photos after a time sync completes.
 */
export async function batchUpdateCorrectedTakenAt(
  supabase: SupabaseServerClient,
  updates: { id: string; corrected_taken_at: string }[],
): Promise<void> {
  if (updates.length === 0) return;

  const { error } = await supabase.from('photos').upsert(updates, { onConflict: 'id' });

  if (error) {
    throw new Error(`Failed to batch update corrected_taken_at: ${getErrorMessage(error)}`);
  }
}

/**
 * Delete a photo
 */
export async function deletePhoto(
  supabase: SupabaseServerClient,
  photoId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase.from('photos').delete().eq('id', photoId).eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete photo: ${getErrorMessage(error)}`);
  }
}

/**
 * Delete all photos for an event
 */
export async function deleteEventPhotos(
  supabase: SupabaseServerClient,
  eventId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from('photos')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete event photos: ${getErrorMessage(error)}`);
  }
}
