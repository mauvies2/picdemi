import { notFound } from 'next/navigation';
import { getActiveRole } from '@/app/[lang]/actions/roles';
import { AIMatchingButton } from '@/app/[lang]/dashboard/talent/photos/ai-matching/ai-matching-button';
import { CartLinkButton } from '@/components/cart-link-button';
import {
  createPhotoUrls,
  getEventByShareCode,
  getEventPhotosPublic,
  isPhotoInCart,
  type SupabaseServerClient,
} from '@/database/queries';
import { createClient } from '@/database/server';
import { supabaseAdmin } from '@/database/supabase-admin';
import { getBaseUrl } from '@/lib/get-base-url';
import { PublicEventPhotoViewer } from './public-event-photo-viewer';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EventPage({ params }: { params: Promise<{ shareCode: string }> }) {
  const { shareCode: slug } = await params;
  const supabase = await createClient();

  // Detect whether the slug is a UUID (public event by ID) or a share code
  const isEventId = UUID_REGEX.test(slug);

  let event: {
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
    user_id: string;
  } | null = null;

  if (isEventId) {
    // Public event — bypass RLS for anonymous visitors
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', slug)
      .eq('is_public', true)
      .is('deleted_at', null)
      .single();
    if (error || !data) notFound();
    event = data;
  } else {
    // Private event via share code
    event = await getEventByShareCode(supabaseAdmin as unknown as SupabaseServerClient, slug);
  }

  if (!event) notFound();

  const photos = await getEventPhotosPublic(
    supabaseAdmin as unknown as SupabaseServerClient,
    event.id,
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Always watermark on public/share pages — photos are only unwatermarked after purchase
  const useWatermark = event.watermark_enabled === true;
  const photosInCart: string[] = [];
  let isTalent = false;

  try {
    if (user) {
      const { activeRole } = await getActiveRole();
      isTalent = activeRole === 'talent';
      if (isTalent) {
        for (const photo of photos) {
          const inCart = await isPhotoInCart(
            supabase as unknown as SupabaseServerClient,
            user.id,
            photo.id,
          );
          if (inCart) photosInCart.push(photo.id);
        }
      }
    }
  } catch {
    // ignore — photosInCart stays empty
  }

  const paths = photos.map((p) => p.original_url).filter((url): url is string => url !== null);
  const signed: Record<string, string> = {};

  if (paths.length > 0) {
    const baseUrl = await getBaseUrl();
    const photoUrls = await createPhotoUrls(
      supabaseAdmin as unknown as SupabaseServerClient,
      'photos',
      paths,
      { expiresIn: 60 * 60, useWatermark, baseUrl },
    );
    for (const item of photoUrls) {
      if (item.signedUrl) signed[item.path] = item.signedUrl;
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
        originalPath: p.original_url,
      };
    })
    .filter(
      (
        item,
      ): item is {
        id: string;
        url: string;
        alt: string;
        originalPath: string | null;
      } => item !== null,
    );

  return (
    <div className="min-h-screen max-w-7xl mx-auto bg-background py-6">
      <div className="container py-3">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{event.name}</h1>
            <div className="mt-1 text-sm text-muted-foreground">
              {new Date(event.date).toDateString().split(' ').slice(1).join(' ')} •{' '}
              {event.city[0]?.toUpperCase() + event.city.slice(1)}
              {event.price_per_photo !== null && (
                <> • ${event.price_per_photo.toFixed(2)} per photo</>
              )}
            </div>
          </div>
          <CartLinkButton guest={!user} />
        </div>

        {photoItems.length > 0 && (
          <div className="mb-3 flex justify-end">
            <AIMatchingButton className="h-9 rounded-full" />
          </div>
        )}
        <PublicEventPhotoViewer
          photos={photoItems}
          eventId={event.id}
          eventName={event.name}
          eventDate={event.date}
          pricePerPhoto={event.price_per_photo}
          photographerId={event.user_id}
          isAuthenticated={!!user}
          initialPhotosInCart={photosInCart}
        />
      </div>
    </div>
  );
}
