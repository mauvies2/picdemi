import { searchEventsAction } from '@/app/dashboard/talent/events/actions';
import { ExplorePageContent } from '@/app/dashboard/talent/events/explore-page-content';
import { EventSearchBar } from '@/components/event-search-bar';
import { Footer } from '@/components/footer';
import { getEventFilterOptions, type SupabaseServerClient } from '@/database/queries';
import { supabaseAdmin } from '@/database/supabase-admin';
import type { EventWithStats } from '@/hooks/use-event-search';

export default async function PublicEventsPage({
  searchParams,
}: {
  searchParams: Promise<{
    where?: string;
    activity?: string;
    dateFrom?: string;
    dateTo?: string;
    preset?: string;
    lat?: string;
    lng?: string;
    radius?: string;
  }>;
}) {
  const {
    where,
    activity,
    dateFrom,
    dateTo,
    preset,
    lat: latStr,
    lng: lngStr,
    radius: radiusStr,
  } = await searchParams;
  const parsedLat = latStr ? Number.parseFloat(latStr) : undefined;
  const parsedLng = lngStr ? Number.parseFloat(lngStr) : undefined;
  const parsedRadius = radiusStr ? Number.parseInt(radiusStr, 10) : undefined;
  const filterOptions = await getEventFilterOptions(supabaseAdmin as SupabaseServerClient);

  // Pre-fetch events server-side so the client skips the duplicate POST on mount.
  // Only when location is known (i.e. `where` is in the URL); otherwise the client
  // handles geolocation and fetches on its own.
  let initialEvents: EventWithStats[] | undefined;
  let initialTotal: number | undefined;

  if (where) {
    try {
      // Replicate the hook's logic: exact city/country match → filter; otherwise → searchText
      const matchedCity = filterOptions.cities.find((c) => c.toLowerCase() === where.toLowerCase());
      const matchedCountry = filterOptions.countries.find(
        (c) => c.toLowerCase() === where.toLowerCase(),
      );

      const result = await searchEventsAction({
        searchText: matchedCity || matchedCountry ? undefined : where,
        activities: activity ? [activity] : undefined,
        cities: matchedCity ? [matchedCity] : undefined,
        countries: matchedCountry ? [matchedCountry] : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        lat: parsedLat,
        lng: parsedLng,
        radiusKm: parsedRadius && parsedRadius > 0 ? parsedRadius : undefined,
      });

      initialEvents = result.events.map((e) => ({
        ...e,
        pricePerPhoto: e.price_per_photo,
      }));
      initialTotal = result.total;
    } catch {
      // fallback: client will fetch
    }
  }

  const searchKey = `${where ?? ''}-${activity ?? ''}-${dateFrom ?? ''}-${dateTo ?? ''}-${preset ?? ''}-${latStr ?? ''}-${radiusStr ?? ''}`;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar */}
      <div className="mx-auto max-w-7xl w-full px-4 pt-6 pb-2">
        <div className="flex justify-center">
          <EventSearchBar
            key={searchKey}
            variant="hero"
            initialWhere={where ?? ''}
            initialActivity={activity ?? ''}
            initialDateFrom={dateFrom ?? ''}
            initialDateTo={dateTo ?? ''}
            initialPreset={preset}
            initialLat={parsedLat}
            initialLng={parsedLng}
            initialRadius={parsedRadius}
          />
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl w-full flex-1 px-4 py-6">
        <ExplorePageContent
          key={searchKey}
          initialFilterOptions={filterOptions}
          initialEvents={initialEvents}
          initialTotal={initialTotal}
          initialLat={parsedLat}
          initialLng={parsedLng}
          initialRadius={parsedRadius}
          eventLinkPrefix="/events"
          loadOnMount={true}
          initialWhere={where}
          initialActivity={activity}
          initialDateFrom={dateFrom}
          initialDateTo={dateTo}
          hideTopFilters={true}
          showFindMe={false}
        />
      </div>
      <Footer />
    </div>
  );
}
