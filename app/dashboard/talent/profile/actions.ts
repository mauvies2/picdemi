'use server';

import { getProfile } from '@/database/queries/profiles';
import { createSignedUrls } from '@/database/queries/storage';
import {
  getTalentPurchasedEventsCount,
  getTalentPurchasedPhotos,
  getTalentPurchasedPhotosCount,
} from '@/database/queries/talent-library';
import { createClient } from '@/database/server';

export interface ProfileData {
  profile: {
    display_name: string | null;
    username: string;
    bio: string | null;
    avatar_url: string | null;
  } | null;
  stats: {
    purchasedPhotosCount: number;
    eventsCount: number;
  };
  photos: Array<{
    photo_id: string;
    preview_url: string | null;
    download_url: string | null;
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
  }>;
}

export async function getProfileData(): Promise<ProfileData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Fetch data in parallel
  const [profile, purchasedPhotosCount, eventsCount, purchasedPhotos] = await Promise.all([
    getProfile(supabase, user.id),
    getTalentPurchasedPhotosCount(supabase, user.id),
    getTalentPurchasedEventsCount(supabase, user.id),
    getTalentPurchasedPhotos(supabase, user.id, { limit: 500 }),
  ]);

  // Generate signed URLs for previews (1 hour expiry)
  const photoPaths = purchasedPhotos
    .map((p) => p.original_url)
    .filter((url): url is string => url !== null);

  const signedUrlsMap: Record<string, string | null> = {};
  if (photoPaths.length > 0) {
    const signedUrls = await createSignedUrls(
      supabase,
      'photos',
      photoPaths,
      60 * 60, // 1 hour
    );
    for (const item of signedUrls) {
      if (item.signedUrl) {
        signedUrlsMap[item.path] = item.signedUrl;
      }
    }
  }

  // Map photos with URLs
  const photosWithUrls = purchasedPhotos.map((photo) => ({
    photo_id: photo.photo_id,
    preview_url: photo.original_url ? (signedUrlsMap[photo.original_url] ?? null) : null,
    download_url: photo.original_url, // Store path for download action
    taken_at: photo.taken_at,
    purchased_at: photo.purchased_at,
    event_id: photo.event_id,
    event_name: photo.event_name,
    event_date: photo.event_date,
    event_city: photo.event_city,
    event_country: photo.event_country,
    photographer_id: photo.photographer_id,
    photographer_username: photo.photographer_username,
    photographer_display_name: photo.photographer_display_name,
    order_id: photo.order_id,
  }));

  return {
    profile: profile
      ? {
          display_name: profile.display_name ?? null,
          username: profile.username,
          bio: profile.bio ?? null,
          avatar_url: (typeof user.user_metadata?.avatar_url === 'string'
            ? user.user_metadata.avatar_url
            : null) as string | null,
        }
      : null,
    stats: {
      purchasedPhotosCount,
      eventsCount,
    },
    photos: photosWithUrls,
  };
}

/**
 * Generate a download URL for a purchased photo (no watermark, high-res)
 */
export async function getPhotoDownloadUrl(photoPath: string): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Verify the user has purchased this photo
  const { data: orderItems } = await supabase
    .from('order_items')
    .select(
      `
      id,
      orders!inner(
        user_id,
        status
      ),
      photos!inner(
        original_url
      )
    `,
    )
    .eq('orders.user_id', user.id)
    .eq('orders.status', 'completed')
    .eq('photos.original_url', photoPath)
    .limit(1);

  if (!orderItems || orderItems.length === 0) {
    throw new Error('Photo not found or not purchased');
  }

  // Generate signed URL for download (24 hour expiry for downloads)
  const results = await createSignedUrls(supabase, 'photos', [photoPath], 24 * 60 * 60);
  return results[0]?.signedUrl ?? null;
}
