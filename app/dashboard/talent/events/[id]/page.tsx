import { notFound } from 'next/navigation';
import { getActiveRole } from '@/app/actions/roles';
import { DashboardHeader } from '@/components/dashboard-header';
import { createPhotoUrls, getEventPhotosPublic, isPhotoInCart } from '@/database/queries';
import { createClient } from '@/database/server';
import { getBaseUrl } from '@/lib/get-base-url';
import { EventPhotoViewer } from './event-photo-viewer';

export default async function ExploreEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Get event by ID - must be public
  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .eq('is_public', true)
    .single();

  if (error || !event) {
    notFound();
  }

  // Get photos for the event
  const photos = await getEventPhotosPublic(supabase, event.id);

  // Get user info for watermark and cart check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if user is talent (watermark only shows for talent users)
  let useWatermark = false;
  const photosInCart: string[] = [];
  try {
    if (user) {
      const { activeRole } = await getActiveRole();
      // Only show watermark for talent users if watermark is enabled
      useWatermark = activeRole === 'talent' && event.watermark_enabled === true;

      // Check which photos are in cart (only for talent users)
      if (activeRole === 'talent') {
        const photoIds = photos.map((p) => p.id);
        for (const photoId of photoIds) {
          const inCart = await isPhotoInCart(supabase, user.id, photoId);
          if (inCart) {
            photosInCart.push(photoId);
          }
        }
      }
    }
  } catch {
    // User not logged in or error - no watermark, no cart
    useWatermark = false;
  }

  // Generate URLs (watermarked or regular signed URLs)
  const paths = photos.map((p) => p.original_url).filter((url): url is string => url !== null);
  const signed: Record<string, string> = {};

  if (paths.length > 0) {
    const baseUrl = await getBaseUrl();
    const photoUrls = await createPhotoUrls(supabase, 'photos', paths, {
      expiresIn: 60 * 60, // 1 hour
      useWatermark,
      baseUrl,
    });
    for (const item of photoUrls) {
      if (item.signedUrl) {
        signed[item.path] = item.signedUrl;
      }
    }
  }

  const photoItems = photos
    .map((p) => {
      const url = p.original_url ? signed[p.original_url] : null;
      if (!url) return null;
      return {
        id: p.id,
        url,
        alt: p.original_url || `Photo from ${event.name}`,
      };
    })
    .filter(
      (
        item,
      ): item is {
        id: string;
        url: string;
        alt: string;
      } => item !== null,
    );

  return (
    <div className="space-y-4">
      <div>
        <DashboardHeader title={event.name} />
        <div className="text-sm text-muted-foreground">
          {new Date(event.date).toDateString().split(' ').slice(1).join(' ')} •{' '}
          {event.city[0]?.toUpperCase() + event.city.slice(1)}
          {event.price_per_photo !== null && <> • ${event.price_per_photo.toFixed(2)} per photo</>}
        </div>
      </div>

      {photoItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No photos available yet.</p>
        </div>
      ) : (
        <div className="w-full">
          <EventPhotoViewer
            items={photoItems}
            showAddToCart={user !== null}
            photosInCart={new Set(photosInCart)}
          />
        </div>
      )}
    </div>
  );
}
