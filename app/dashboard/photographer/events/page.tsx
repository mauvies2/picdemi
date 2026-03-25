import { DashboardHeader } from '@/components/dashboard-header';
import { createSignedUrl, getPhotosForEvents, getUserEvents } from '@/database/queries';
import { createClient } from '@/database/server';
import { deleteEventAction as deleteEvent } from './actions';
import { EventCard } from './event-card';

async function getEventSalesCounts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventIds: string[],
  photographerId: string,
): Promise<Map<string, number>> {
  if (eventIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from('order_items')
    .select(
      `
      photo_id,
      orders!inner(
        id,
        status
      ),
      photos!inner(
        event_id
      )
    `,
    )
    .eq('photographer_id', photographerId)
    .eq('orders.status', 'completed')
    .in('photos.event_id', eventIds);

  if (error) {
    console.error('Error fetching event sales:', error);
    return new Map();
  }

  const uniqueOrdersPerEvent = new Map<string, Set<string>>();

  const items = (data ?? []) as Array<{
    photos: Array<{ event_id: string | null }> | { event_id: string | null };
    orders: Array<{ id: string }> | { id: string };
  }>;

  items.forEach((item) => {
    const photo = Array.isArray(item.photos) ? item.photos[0] : item.photos;
    const order = Array.isArray(item.orders) ? item.orders[0] : item.orders;
    if (!photo?.event_id || !order?.id) return;

    const eventId = photo.event_id;
    const orderSet = uniqueOrdersPerEvent.get(eventId) ?? new Set<string>();
    orderSet.add(order.id);
    uniqueOrdersPerEvent.set(eventId, orderSet);
  });

  // Convert sets to counts
  const salesCounts = new Map<string, number>();
  uniqueOrdersPerEvent.forEach((orderSet, eventId) => {
    salesCounts.set(eventId, orderSet.size);
  });

  return salesCounts;
}

export default async function EventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div>
        <DashboardHeader title="Events" />
        <p className="mt-2 text-muted-foreground">Please sign in to view your events.</p>
      </div>
    );
  }

  const events = await getUserEvents(supabase, user.id);
  const eventIds = events.map((e) => e.id).filter(Boolean);
  const [photoRows, salesCounts] = await Promise.all([
    getPhotosForEvents(supabase, eventIds),
    getEventSalesCounts(supabase, eventIds, user.id),
  ]);

  const stats = new Map<
    string,
    {
      count: number;
      coverPath: string | null;
      firstTakenAt: string | null;
      lastTakenAt: string | null;
    }
  >();

  (photoRows ?? []).forEach((row) => {
    if (!row.event_id) return;
    const current = stats.get(row.event_id) ?? {
      count: 0,
      coverPath: null,
      firstTakenAt: null,
      lastTakenAt: null,
    };
    current.count += 1;
    if (!current.coverPath && row.original_url) {
      current.coverPath = row.original_url;
    }
    if (row.taken_at) {
      if (!current.firstTakenAt) current.firstTakenAt = row.taken_at;
      current.lastTakenAt = row.taken_at;
    }
    stats.set(row.event_id, current);
  });

  // Ensure events with zero photos still have stats entry
  (events ?? []).forEach((event) => {
    if (!stats.has(event.id)) {
      stats.set(event.id, {
        count: 0,
        coverPath: null,
        firstTakenAt: null,
        lastTakenAt: null,
      });
    }
  });

  // Sign covers per-event (more robust with special characters/ordering)
  const coverUrls = new Map<string, string>();
  await Promise.all(
    Array.from(stats.entries()).map(async ([eventId, info]) => {
      if (!info.coverPath) return;
      const signedUrl = await createSignedUrl(supabase, 'photos', info.coverPath, 60 * 60);
      if (signedUrl) coverUrls.set(eventId, signedUrl);
    }),
  );

  return (
    <div>
      <DashboardHeader title="Events" />
      <div className="text-sm text-muted-foreground">
        {events.length
          ? `${events.length} event${events.length === 1 ? '' : 's'}`
          : 'No events yet.'}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {events.map((event) => {
          const stat = stats.get(event.id) ?? {
            count: 0,
            coverPath: null,
            firstTakenAt: null,
            lastTakenAt: null,
          };
          const count = stat.count;
          const coverUrl = coverUrls.get(event.id);

          return (
            <EventCard
              key={event.id}
              id={event.id}
              name={event.name}
              date={event.date}
              city={event.city}
              country={event.country}
              activity={event.activity}
              pricePerPhoto={event.price_per_photo}
              photoCount={count}
              salesCount={salesCounts.get(event.id) ?? 0}
              isPublic={event.is_public}
              coverUrl={coverUrl}
              editHref={`/dashboard/photographer/events/${event.id}/edit`}
              onDelete={deleteEvent.bind(null, event.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
