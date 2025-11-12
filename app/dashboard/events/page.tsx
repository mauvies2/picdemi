import { DashboardHeader } from "@/components/dashboard-header";
import {
  createSignedUrl,
  getPhotosForEvents,
  getUserEvents,
} from "@/database/queries";
import { createClient } from "@/database/server";
import { deleteEventAction as deleteEvent } from "./actions";
import { EventCard } from "./event-card";

export default async function EventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="p-4">
        <DashboardHeader title="Events" />
        <p className="mt-2 text-muted-foreground">
          Please sign in to view your events.
        </p>
      </div>
    );
  }

  const events = await getUserEvents(supabase, user.id);
  const eventIds = events.map((e) => e.id).filter(Boolean);
  const photoRows = await getPhotosForEvents(supabase, eventIds);

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
      const signedUrl = await createSignedUrl(
        supabase,
        "photos",
        info.coverPath,
        60 * 60,
      );
      if (signedUrl) coverUrls.set(eventId, signedUrl);
    }),
  );

  return (
    <div className="p-4">
      <DashboardHeader title="Events" />
      <div className="text-sm text-muted-foreground">
        {events.length
          ? `${events.length} event${events.length === 1 ? "" : "s"}`
          : "No events yet."}
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
              photoCount={count}
              coverUrl={coverUrl}
              editHref={`/dashboard/events/${event.id}/edit`}
              onDelete={deleteEvent.bind(null, event.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
