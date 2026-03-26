import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { cache } from 'react';
import { getActiveRole } from '@/app/actions/roles';
import { activityOptions } from '@/app/dashboard/photographer/events/new/activity-options';
import { AIMatchingButton } from '@/app/dashboard/talent/photos/ai-matching/ai-matching-button';
import { CartLinkButton } from '@/components/cart-link-button';
import {
  createPhotoUrls,
  getEventByShareCode,
  getEventBySlug,
  getEventPhotosPublic,
  isPhotoInCart,
  type SupabaseServerClient,
} from '@/database/queries';
import { createClient } from '@/database/server';
import { supabaseAdmin } from '@/database/supabase-admin';
import { getBaseUrl } from '@/lib/get-base-url';
import { getSiteUrl } from '@/lib/get-site-url';
import { PublicEventPhotoViewer } from './public-event-photo-viewer';

// ─── Types ────────────────────────────────────────────────────────────────────

type EventRow = {
  id: string;
  name: string;
  date: string;
  city: string;
  country: string;
  state: string;
  activity: string;
  is_public: boolean;
  share_code: string | null;
  slug: string | null;
  price_per_photo: number | null;
  watermark_enabled: boolean;
  user_id: string;
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─── Cached event fetcher ─────────────────────────────────────────────────────
// React cache() deduplicates this across generateMetadata + the page render
// within a single request — the DB is only queried once.

const fetchEvent = cache(async (param: string): Promise<EventRow | null> => {
  // 1. UUID → direct public event lookup by primary key
  if (UUID_REGEX.test(param)) {
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', param)
      .eq('is_public', true)
      .is('deleted_at', null)
      .single();
    if (error || !data) return null;
    return data as EventRow;
  }

  // 2. Try SEO slug (public events only)
  const bySlug = await getEventBySlug(supabaseAdmin as unknown as SupabaseServerClient, param);
  if (bySlug) return bySlug as EventRow;

  // 3. Fall back to share code (handles private events)
  const byShareCode = await getEventByShareCode(
    supabaseAdmin as unknown as SupabaseServerClient,
    param,
  );
  return byShareCode as EventRow | null;
});

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shareCode: string }>;
}): Promise<Metadata> {
  const { shareCode: param } = await params;
  const event = await fetchEvent(param);

  if (!event) return { title: 'Event Not Found' };

  const siteUrl = getSiteUrl();
  // Canonical always points to the slug URL; fall back to UUID for legacy events
  const canonicalPath = event.slug ?? event.id;
  const canonicalUrl = `${siteUrl}/events/${canonicalPath}`;

  const activityLabel =
    activityOptions.find((o) => o.value === event.activity)?.label ?? event.activity;
  const location = [event.city, event.country].filter(Boolean).join(', ');
  const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Title pattern: [Event Name] Photos | [Location] | [Date]
  // Root layout template appends "| Picdemi"
  const title = `${event.name} Photos | ${location} | ${formattedDate}`;
  const description = `Browse ${activityLabel} photos from ${event.name} in ${location} on ${formattedDate}. Find yourself in professional high-resolution event photos and download your best shots.`;

  // Sign the cover photo for OpenGraph (24 h TTL — social crawlers cache on first fetch)
  const ogImages: { url: string; width: number; height: number; alt: string }[] = [];
  const { data: firstPhotoRow } = await supabaseAdmin
    .from('photos')
    .select('original_url')
    .eq('event_id', event.id)
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle();

  if (firstPhotoRow?.original_url) {
    const { data: signedData } = await supabaseAdmin.storage
      .from('photos')
      .createSignedUrl(firstPhotoRow.original_url, 60 * 60 * 24);
    if (signedData?.signedUrl) {
      ogImages.push({ url: signedData.signedUrl, width: 1200, height: 630, alt: title });
    }
  }

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      // hreflang foundation — add /es routes here once locale routing is implemented
      languages: {
        en: canonicalUrl,
        'x-default': canonicalUrl,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      // "article" signals to crawlers this is specific content, not a generic listing
      type: 'article',
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImages.map((i) => i.url),
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function EventPage({ params }: { params: Promise<{ shareCode: string }> }) {
  const { shareCode: param } = await params;
  const supabase = await createClient();

  const event = await fetchEvent(param);
  if (!event) notFound();

  // Permanent redirect: UUID visitors with a slug get sent to the canonical slug URL.
  // This consolidates link equity onto a single URL.
  if (UUID_REGEX.test(param) && event.slug) {
    redirect(`/events/${event.slug}`);
  }

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

  try {
    if (user) {
      const { activeRole } = await getActiveRole();
      if (activeRole === 'talent') {
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

  const activityLabel =
    activityOptions.find((o) => o.value === event.activity)?.label ?? event.activity;
  const location = [event.city, event.country].filter(Boolean).join(', ');

  const photoItems = photos
    .map((p) => {
      const url = p.original_url ? signed[p.original_url] : null;
      if (!url) return null;
      return {
        id: p.id,
        url,
        // Descriptive alt text — improves image SEO and screen reader experience
        alt: `${activityLabel} photo at ${event.name} in ${location}`,
        originalPath: p.original_url,
      };
    })
    .filter(
      (item): item is { id: string; url: string; alt: string; originalPath: string | null } =>
        item !== null,
    );

  // ─── Structured data (JSON-LD) ──────────────────────────────────────────────
  const siteUrl = getSiteUrl();
  const canonicalPath = event.slug ?? event.id;
  const eventUrl = `${siteUrl}/events/${canonicalPath}`;
  const coverUrl = photoItems[0]?.url ?? null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      // SportsEvent — enables event rich results in Google Search
      {
        '@type': 'SportsEvent',
        name: event.name,
        startDate: event.date,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        url: eventUrl,
        ...(coverUrl ? { image: coverUrl } : {}),
        location: {
          '@type': 'Place',
          name: event.city,
          address: {
            '@type': 'PostalAddress',
            addressLocality: event.city,
            addressRegion: event.state,
            addressCountry: event.country,
          },
        },
        organizer: {
          '@type': 'Organization',
          name: 'Picdemi',
          url: siteUrl,
        },
        // Pricing offer — shown in rich results when price is public
        ...(event.price_per_photo !== null
          ? {
              offers: {
                '@type': 'Offer',
                price: event.price_per_photo,
                priceCurrency: 'USD',
                availability: 'https://schema.org/InStock',
                url: eventUrl,
              },
            }
          : {}),
      },

      // ImageGallery — signals to Google this is a photo gallery page
      {
        '@type': 'ImageGallery',
        name: `${event.name} — Photo Gallery`,
        description: `${activityLabel} photos from ${event.name} in ${location}`,
        url: eventUrl,
        numberOfItems: photoItems.length,
        ...(coverUrl ? { thumbnailUrl: coverUrl } : {}),
      },

      // BreadcrumbList — enables breadcrumb rich snippets in search results
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Events', item: `${siteUrl}/events` },
          { '@type': 'ListItem', position: 3, name: event.name, item: eventUrl },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen max-w-7xl mx-auto bg-background py-6">
      {/* Structured data — server-generated, not user input */}
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: server-generated structured data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container py-3">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            {/* Single h1 per page — the event name is the primary subject */}
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
