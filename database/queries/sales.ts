/**
 * Sales-related database queries
 */

import type { SupabaseServerClient } from "./types";
import { getErrorMessage } from "./types";

export interface Sale {
  id: string;
  photo_id: string;
  photographer_id: string;
  unit_price_cents: number;
  created_at: string;
  photo_url: string | null;
  event_id: string | null;
  event_name: string | null;
  event_date: string | null;
  buyer_id: string;
  buyer_email: string | null;
}

export interface SalesSummary {
  totalRevenueCents: number;
  totalSales: number;
  averageOrderValueCents: number;
  totalPhotosSold: number;
}

export interface SalesByDate {
  date: string;
  revenue_cents: number;
  sales_count: number;
}

export interface TopSellingPhoto {
  photo_id: string;
  photo_url: string | null;
  event_id: string | null;
  event_name: string | null;
  sales_count: number;
  revenue_cents: number;
}

export interface TopSellingEvent {
  event_id: string;
  event_name: string | null;
  event_date: string | null;
  sales_count: number;
  revenue_cents: number;
  photos_sold: number;
}

/**
 * Get sales summary for a photographer
 *
 * NOTE: Currently returns zeros as there's no purchase/order system yet.
 * Once an orders/purchases table is implemented, this should query actual completed purchases.
 */
export async function getSalesSummary(
  supabase: SupabaseServerClient,
  photographerId: string,
  startDate?: string,
  endDate?: string,
): Promise<SalesSummary> {
  // TODO: Implement actual sales tracking when purchase/order system is added
  // For now, return zeros since cart_items only represent items in carts, not completed purchases
  return {
    totalRevenueCents: 0,
    totalSales: 0,
    averageOrderValueCents: 0,
    totalPhotosSold: 0,
  };
}

/**
 * Get sales over time grouped by date
 *
 * NOTE: Currently returns empty array as there's no purchase/order system yet.
 * Once an orders/purchases table is implemented, this should query actual completed purchases.
 */
export async function getSalesOverTime(
  supabase: SupabaseServerClient,
  photographerId: string,
  startDate?: string,
  endDate?: string,
  groupBy: "day" | "week" | "month" = "day",
): Promise<SalesByDate[]> {
  // TODO: Implement actual sales tracking when purchase/order system is added
  // For now, return empty array since cart_items only represent items in carts, not completed purchases
  return [];
}

/**
 * Get top selling photos
 */
export async function getTopSellingPhotos(
  supabase: SupabaseServerClient,
  photographerId: string,
  limit: number = 10,
  startDate?: string,
  endDate?: string,
): Promise<TopSellingPhoto[]> {
  let query = supabase
    .from("cart_items")
    .select(
      `
      photo_id,
      unit_price_cents,
      created_at,
      photos(
        original_url,
        event_id,
        events(
          name,
          date
        )
      )
    `,
    )
    .eq("photographer_id", photographerId);

  if (startDate) {
    query = query.gte("created_at", startDate);
  }
  if (endDate) {
    query = query.lte("created_at", endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(
      `Failed to get top selling photos: ${getErrorMessage(error)}`,
    );
  }

  // Group by photo_id
  const grouped = new Map<
    string,
    {
      photo_url: string | null;
      event_id: string | null;
      event_name: string | null;
      sales_count: number;
      revenue_cents: number;
    }
  >();

  (data ?? []).forEach((item: any) => {
    const photo = item.photos;
    const event = Array.isArray(photo?.events)
      ? photo.events.length > 0
        ? photo.events[0]
        : null
      : photo?.events;

    const current = grouped.get(item.photo_id) ?? {
      photo_url: photo?.original_url ?? null,
      event_id: photo?.event_id ?? null,
      event_name: event?.name ?? null,
      sales_count: 0,
      revenue_cents: 0,
    };

    grouped.set(item.photo_id, {
      ...current,
      sales_count: current.sales_count + 1,
      revenue_cents: current.revenue_cents + item.unit_price_cents,
    });
  });

  return Array.from(grouped.entries())
    .map(([photo_id, stats]) => ({
      photo_id,
      photo_url: stats.photo_url,
      event_id: stats.event_id,
      event_name: stats.event_name,
      sales_count: stats.sales_count,
      revenue_cents: stats.revenue_cents,
    }))
    .sort((a, b) => b.sales_count - a.sales_count)
    .slice(0, limit);
}

/**
 * Get top selling events
 *
 * NOTE: Currently returns empty array as there's no purchase/order system yet.
 * Once an orders/purchases table is implemented, this should query actual completed purchases.
 */
export async function getTopSellingEvents(
  supabase: SupabaseServerClient,
  photographerId: string,
  limit: number = 10,
  startDate?: string,
  endDate?: string,
): Promise<TopSellingEvent[]> {
  // TODO: Implement actual sales tracking when purchase/order system is added
  // For now, return empty array since cart_items only represent items in carts, not completed purchases
  return [];
}

/**
 * Get recent sales with details
 */
export async function getRecentSales(
  supabase: SupabaseServerClient,
  photographerId: string,
  limit: number = 20,
  startDate?: string,
  endDate?: string,
): Promise<Sale[]> {
  let query = supabase
    .from("cart_items")
    .select(
      `
      id,
      photo_id,
      photographer_id,
      unit_price_cents,
      created_at,
      cart_id,
      carts(
        user_id
      ),
      photos(
        original_url,
        event_id,
        events(
          name,
          date
        )
      )
    `,
    )
    .eq("photographer_id", photographerId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (startDate) {
    query = query.gte("created_at", startDate);
  }
  if (endDate) {
    query = query.lte("created_at", endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get recent sales: ${getErrorMessage(error)}`);
  }

  // Get unique buyer IDs
  const buyerIds = [
    ...new Set(
      (data ?? [])
        .map((item: any) => item.carts?.user_id)
        .filter((id): id is string => typeof id === "string"),
    ),
  ];

  // Fetch user emails using RPC function if available
  const buyerEmailMap: Record<string, string | null> = {};

  if (buyerIds.length > 0) {
    try {
      // Try to use the batch RPC function if it exists
      const { data: userEmails } = await supabase.rpc("get_user_emails_batch", {
        user_ids: buyerIds,
      });

      if (userEmails) {
        for (const user of userEmails) {
          buyerEmailMap[user.id] = user.email ?? null;
        }
      }
    } catch {
      // RPC function might not exist or might fail, continue without emails
    }
  }

  return (data ?? []).map((item: any) => {
    const photo = item.photos;
    const event = Array.isArray(photo?.events)
      ? photo.events.length > 0
        ? photo.events[0]
        : null
      : photo?.events;
    const cart = item.carts;

    return {
      id: item.id,
      photo_id: item.photo_id,
      photographer_id: item.photographer_id,
      unit_price_cents: item.unit_price_cents,
      created_at: item.created_at,
      photo_url: photo?.original_url ?? null,
      event_id: photo?.event_id ?? null,
      event_name: event?.name ?? null,
      event_date: event?.date ?? null,
      buyer_id: cart?.user_id ?? "",
      buyer_email: buyerEmailMap[cart?.user_id ?? ""] ?? null,
    };
  }) as Sale[];
}
