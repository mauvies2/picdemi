"use server";

import { getCartItemCount } from "@/database/queries/carts";
import { getUserOrders } from "@/database/queries/orders";
import { createPhotoUrls } from "@/database/queries/storage";
import {
  getTaggedPhotosCountForTalent,
  getTaggedPhotosForTalent,
} from "@/database/queries/talent-photo-tags";
import { createClient } from "@/database/server";
import { getBaseUrl } from "@/lib/get-base-url";

export async function getTalentDashboardData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // Fetch all data in parallel
  const [taggedPhotosCount, recentTaggedPhotos, cartItemCount, recentOrders] =
    await Promise.all([
      getTaggedPhotosCountForTalent(supabase, user.id),
      getTaggedPhotosForTalent(supabase, user.id, { limit: 3 }),
      getCartItemCount(supabase, user.id),
      getUserOrders(supabase, user.id, 5),
    ]);

  // Get actual purchased photos count from all completed orders
  let totalPurchasedPhotos = 0;
  const { data: allCompletedOrders } = await supabase
    .from("orders")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "completed");

  if (allCompletedOrders && allCompletedOrders.length > 0) {
    const { count: purchasedCount } = await supabase
      .from("order_items")
      .select("*", { count: "exact", head: true })
      .in(
        "order_id",
        allCompletedOrders.map((o) => o.id),
      );

    totalPurchasedPhotos = purchasedCount ?? 0;
  }

  // Generate signed URLs for recent tagged photos
  const photoPaths = recentTaggedPhotos
    .map((p) => p.photo_url)
    .filter((url): url is string => url !== null);

  const signedUrlsMap: Record<string, string | null> = {};
  if (photoPaths.length > 0) {
    // Group photos by watermark requirement
    const photosByWatermark = new Map<boolean, string[]>();
    for (const photo of recentTaggedPhotos) {
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

  // Get order items with photo details for recent orders
  const ordersWithItems = await Promise.all(
    recentOrders.map(async (order) => {
      const { data: items } = await supabase
        .from("order_items")
        .select(
          `
          id,
          photo_id,
          unit_price_cents,
          total_price_cents,
          photos(
            original_url,
            events(
              name,
              date
            )
          )
        `,
        )
        .eq("order_id", order.id)
        .limit(3);

      type OrderItemWithPhoto = {
        id: string;
        photo_id: string;
        unit_price_cents: number;
        total_price_cents: number;
        photos:
          | {
              original_url: string | null;
              events:
                | {
                    name: string;
                    date: string;
                  }[]
                | {
                    name: string;
                    date: string;
                  }
                | null;
            }[]
          | {
              original_url: string | null;
              events:
                | {
                    name: string;
                    date: string;
                  }[]
                | {
                    name: string;
                    date: string;
                  }
                | null;
            }
          | null;
      };

      return {
        ...order,
        items: (items ?? []).map((item: OrderItemWithPhoto) => {
          const photo = Array.isArray(item.photos)
            ? item.photos[0]
            : item.photos;
          const event = Array.isArray(photo?.events)
            ? photo.events[0]
            : photo?.events;
          return {
            photo_id: item.photo_id,
            unit_price_cents: item.unit_price_cents,
            total_price_cents: item.total_price_cents,
            event_name: event?.name ?? null,
            event_date: event?.date ?? null,
          };
        }),
      };
    }),
  );

  return {
    stats: {
      taggedPhotosCount,
      purchasedPhotosCount: totalPurchasedPhotos,
      cartItemCount,
      totalOrders: recentOrders.length,
    },
    recentTaggedPhotos: recentTaggedPhotos.map((photo) => ({
      ...photo,
      signed_url: photo.photo_url
        ? (signedUrlsMap[photo.photo_url] ?? null)
        : null,
    })),
    recentOrders: ordersWithItems,
  };
}
