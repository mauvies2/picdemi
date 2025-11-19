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
 * Queries completed orders from the orders table
 */
export async function getSalesSummary(
  supabase: SupabaseServerClient,
  photographerId: string,
  startDate?: string,
  endDate?: string,
): Promise<SalesSummary> {
  // Query order_items for this photographer with completed orders
  let query = supabase
    .from("order_items")
    .select(
      `
      total_price_cents,
      quantity,
      created_at,
      orders!inner(
        id,
        status,
        created_at
      )
    `,
    )
    .eq("photographer_id", photographerId)
    .eq("orders.status", "completed");

  // Filter by order_items.created_at (which is very close to orders.created_at)
  if (startDate) {
    query = query.gte("created_at", startDate);
  }
  if (endDate) {
    query = query.lte("created_at", endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get sales summary: ${getErrorMessage(error)}`);
  }

  // Calculate totals
  const items = (data ?? []) as Array<{
    total_price_cents: number;
    quantity: number;
    orders: Array<{ id: string; status: string; created_at: string }>;
  }>;

  const totalRevenueCents = items.reduce(
    (sum, item) => sum + item.total_price_cents,
    0,
  );
  const totalPhotosSold = items.reduce((sum, item) => sum + item.quantity, 0);
  const uniqueOrders = new Set(
    items
      .map((item) => item.orders[0]?.id)
      .filter((id): id is string => Boolean(id)),
  );
  const totalSales = uniqueOrders.size;
  const averageOrderValueCents =
    totalSales > 0 ? Math.round(totalRevenueCents / totalSales) : 0;

  return {
    totalRevenueCents,
    totalSales,
    averageOrderValueCents,
    totalPhotosSold,
  };
}

/**
 * Get sales over time grouped by date
 * Queries completed orders from the orders table
 */
export async function getSalesOverTime(
  supabase: SupabaseServerClient,
  photographerId: string,
  startDate?: string,
  endDate?: string,
  groupBy: "day" | "week" | "month" = "day",
): Promise<SalesByDate[]> {
  let query = supabase
    .from("order_items")
    .select(
      `
      total_price_cents,
      quantity,
      created_at,
      orders!inner(
        id,
        created_at,
        status
      )
    `,
    )
    .eq("photographer_id", photographerId)
    .eq("orders.status", "completed")
    .order("created_at", { ascending: true });

  // Filter by order_items.created_at (which is very close to orders.created_at)
  if (startDate) {
    query = query.gte("created_at", startDate);
  }
  if (endDate) {
    query = query.lte("created_at", endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get sales over time: ${getErrorMessage(error)}`);
  }

  // Group by date
  const grouped = new Map<string, { revenue: number; count: number }>();

  const items = (data ?? []) as Array<{
    total_price_cents: number;
    quantity: number;
    created_at: string;
    orders: Array<{ id: string; created_at: string; status: string }>;
  }>;

  items.forEach((item) => {
    // Use order.created_at if available, otherwise fall back to order_items.created_at
    const order = item.orders[0];
    const orderDate = order?.created_at ?? item.created_at;
    const date = new Date(orderDate);
    let key: string;

    if (groupBy === "day") {
      key = date.toISOString().split("T")[0];
    } else if (groupBy === "week") {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split("T")[0];
    } else {
      // month
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    }

    const current = grouped.get(key) ?? { revenue: 0, count: 0 };
    grouped.set(key, {
      revenue: current.revenue + item.total_price_cents,
      count: current.count + item.quantity,
    });
  });

  return Array.from(grouped.entries())
    .map(([date, stats]) => ({
      date,
      revenue_cents: stats.revenue,
      sales_count: stats.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
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
 * Queries completed orders from the orders table
 */
export async function getTopSellingEvents(
  supabase: SupabaseServerClient,
  photographerId: string,
  limit: number = 10,
  startDate?: string,
  endDate?: string,
): Promise<TopSellingEvent[]> {
  let query = supabase
    .from("order_items")
    .select(
      `
      photo_id,
      total_price_cents,
      quantity,
      created_at,
      orders!inner(
        id,
        created_at,
        status
      ),
      photos!inner(
        event_id,
        events(
          name,
          date
        )
      )
    `,
    )
    .eq("photographer_id", photographerId)
    .eq("orders.status", "completed");

  // Filter by order_items.created_at (which is very close to orders.created_at)
  if (startDate) {
    query = query.gte("created_at", startDate);
  }
  if (endDate) {
    query = query.lte("created_at", endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(
      `Failed to get top selling events: ${getErrorMessage(error)}`,
    );
  }

  // Group by event_id
  const grouped = new Map<
    string,
    {
      event_name: string | null;
      event_date: string | null;
      sales_count: number;
      revenue_cents: number;
      photos_sold: Set<string>;
    }
  >();

  const items = (data ?? []) as Array<{
    photo_id: string;
    total_price_cents: number;
    quantity: number;
    orders: Array<{ id: string; created_at: string; status: string }>;
    photos: Array<{
      event_id: string | null;
      events: Array<{ name: string | null; date: string | null }> | null;
    }>;
  }>;

  items.forEach((item) => {
    const photo = Array.isArray(item.photos) ? item.photos[0] : null;
    if (!photo) return;
    const eventId = photo.event_id ?? "unknown";
    const event = Array.isArray(photo.events)
      ? (photo.events[0] ?? null)
      : photo.events;
    const current = grouped.get(eventId) ?? {
      event_name: event?.name ?? null,
      event_date: event?.date ?? null,
      sales_count: 0,
      revenue_cents: 0,
      photos_sold: new Set<string>(),
    };

    current.photos_sold.add(item.photo_id);
    grouped.set(eventId, {
      ...current,
      sales_count: current.sales_count + item.quantity,
      revenue_cents: current.revenue_cents + item.total_price_cents,
    });
  });

  return Array.from(grouped.entries())
    .map(([event_id, stats]) => ({
      event_id,
      event_name: stats.event_name,
      event_date: stats.event_date,
      sales_count: stats.sales_count,
      revenue_cents: stats.revenue_cents,
      photos_sold: stats.photos_sold.size,
    }))
    .sort((a, b) => b.revenue_cents - a.revenue_cents)
    .slice(0, limit);
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
