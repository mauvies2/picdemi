/**
 * Talent Library - queries for purchased photos
 */

import type { SupabaseServerClient } from './types';
import { getErrorMessage } from './types';

export interface PurchasedPhoto {
  photo_id: string;
  original_url: string | null;
  taken_at: string | null;
  purchased_at: string;
  event_id: string | null;
  event_name: string | null;
  event_date: string | null;
  event_city: string | null;
  event_country: string | null;
  photographer_id: string;
  photographer_username: string | null;
  photographer_display_name: string | null;
  order_id: string;
}

/**
 * Get all photos purchased by a talent user
 */
export async function getTalentPurchasedPhotos(
  supabase: SupabaseServerClient,
  talentUserId: string,
  options?: {
    limit?: number;
    offset?: number;
  },
): Promise<PurchasedPhoto[]> {
  const limit = options?.limit ?? 100;
  const offset = options?.offset ?? 0;

  // Get all completed orders for this user
  const { data: completedOrders, error: ordersError } = await supabase
    .from('orders')
    .select('id')
    .eq('user_id', talentUserId)
    .eq('status', 'completed');

  if (ordersError) {
    throw new Error(`Failed to get completed orders: ${getErrorMessage(ordersError)}`);
  }

  if (!completedOrders || completedOrders.length === 0) {
    return [];
  }

  const orderIds = completedOrders.map((o) => o.id);

  // Get order items with photo and event details
  const { data, error } = await supabase
    .from('order_items')
    .select(
      `
      photo_id,
      photographer_id,
      created_at,
      order_id,
      photos!inner(
        original_url,
        taken_at,
        event_id,
        events(
          name,
          date,
          city,
          country
        )
      )
    `,
    )
    .in('order_id', orderIds)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to get purchased photos: ${getErrorMessage(error)}`);
  }

  // Get photographer profiles
  const photographerIds = [...new Set((data ?? []).map((item) => item.photographer_id))];
  const photographerProfilesMap: Record<
    string,
    { username: string | null; display_name: string | null }
  > = {};

  if (photographerIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .in('id', photographerIds);

    if (profiles) {
      for (const profile of profiles) {
        photographerProfilesMap[profile.id] = {
          username: profile.username,
          display_name: profile.display_name,
        };
      }
    }
  }

  // Transform data
  return (data ?? []).map(
    (item: {
      photo_id: string;
      photographer_id: string;
      created_at: string;
      order_id: string;
      photos:
        | Array<{
            original_url: string | null;
            taken_at: string | null;
            event_id: string | null;
            events:
              | Array<{
                  name: string | null;
                  date: string | null;
                  city: string | null;
                  country: string | null;
                }>
              | {
                  name: string | null;
                  date: string | null;
                  city: string | null;
                  country: string | null;
                }
              | null;
          }>
        | {
            original_url: string | null;
            taken_at: string | null;
            event_id: string | null;
            events:
              | Array<{
                  name: string | null;
                  date: string | null;
                  city: string | null;
                  country: string | null;
                }>
              | {
                  name: string | null;
                  date: string | null;
                  city: string | null;
                  country: string | null;
                }
              | null;
          }
        | null;
    }) => {
      const photo = Array.isArray(item.photos) ? item.photos[0] : item.photos;
      const event = photo ? (Array.isArray(photo.events) ? photo.events[0] : photo.events) : null;
      const photographer = photographerProfilesMap[item.photographer_id] ?? {
        username: null,
        display_name: null,
      };

      return {
        photo_id: item.photo_id,
        original_url: photo?.original_url ?? null,
        taken_at: photo?.taken_at ?? null,
        purchased_at: item.created_at,
        event_id: photo?.event_id ?? null,
        event_name: event?.name ?? null,
        event_date: event?.date ?? null,
        event_city: event?.city ?? null,
        event_country: event?.country ?? null,
        photographer_id: item.photographer_id,
        photographer_username: photographer.username,
        photographer_display_name: photographer.display_name,
        order_id: item.order_id,
      };
    },
  ) as PurchasedPhoto[];
}

/**
 * Get count of purchased photos for a talent user
 */
export async function getTalentPurchasedPhotosCount(
  supabase: SupabaseServerClient,
  talentUserId: string,
): Promise<number> {
  // Get all completed orders for this user
  const { data: completedOrders, error: ordersError } = await supabase
    .from('orders')
    .select('id')
    .eq('user_id', talentUserId)
    .eq('status', 'completed');

  if (ordersError) {
    throw new Error(`Failed to get completed orders: ${getErrorMessage(ordersError)}`);
  }

  if (!completedOrders || completedOrders.length === 0) {
    return 0;
  }

  const orderIds = completedOrders.map((o) => o.id);

  const { count, error } = await supabase
    .from('order_items')
    .select('*', { count: 'exact', head: true })
    .in('order_id', orderIds);

  if (error) {
    throw new Error(`Failed to get purchased photos count: ${getErrorMessage(error)}`);
  }

  return count ?? 0;
}

/**
 * Get unique event count from purchased photos
 */
export async function getTalentPurchasedEventsCount(
  supabase: SupabaseServerClient,
  talentUserId: string,
): Promise<number> {
  // Get all completed orders for this user
  const { data: completedOrders, error: ordersError } = await supabase
    .from('orders')
    .select('id')
    .eq('user_id', talentUserId)
    .eq('status', 'completed');

  if (ordersError) {
    throw new Error(`Failed to get completed orders: ${getErrorMessage(ordersError)}`);
  }

  if (!completedOrders || completedOrders.length === 0) {
    return 0;
  }

  const orderIds = completedOrders.map((o) => o.id);

  // Get unique event IDs from purchased photos
  const { data, error } = await supabase
    .from('order_items')
    .select(
      `
      photos!inner(
        event_id
      )
    `,
    )
    .in('order_id', orderIds);

  if (error) {
    throw new Error(`Failed to get purchased events count: ${getErrorMessage(error)}`);
  }

  const eventIds = new Set<string>();
  (data ?? []).forEach(
    (item: { photos: Array<{ event_id: string | null }> | { event_id: string | null } | null }) => {
      const photo = Array.isArray(item.photos) ? item.photos[0] : item.photos;
      if (photo?.event_id) {
        eventIds.add(photo.event_id);
      }
    },
  );

  return eventIds.size;
}
