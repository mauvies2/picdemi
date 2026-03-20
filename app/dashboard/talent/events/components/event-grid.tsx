'use client';

import { Filter, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { EventWithStats } from '@/hooks/use-event-search';
import { ExploreEventCard } from '../explore-event-card';

type EventGridProps = {
  events: EventWithStats[];
  isLoading: boolean;
  isInitialLoad: boolean;
  hasSearched: boolean;
  hasMore: boolean;
  hasFilters: boolean;
  enableLocation: boolean;
  skeletonKeys: string[];
  eventLinkPrefix?: string;
  onLoadMore: () => void;
  onClearFilters: () => void;
};

function EventSkeleton({ skeletonKeys }: { skeletonKeys: string[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {skeletonKeys.map((key) => (
        <div key={key} className="space-y-2">
          <div className="aspect-square w-full animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

export function EventGrid({
  events,
  isLoading,
  isInitialLoad,
  hasSearched,
  hasMore,
  hasFilters,
  enableLocation,
  skeletonKeys,
  eventLinkPrefix,
  onLoadMore,
  onClearFilters,
}: EventGridProps) {
  if (!hasSearched) {
    if (enableLocation) {
      return <EventSkeleton skeletonKeys={skeletonKeys} />;
    }
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <Search className="mx-auto mb-4 h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          Enter an event name above and click <strong>Search</strong> to find your photos.
        </p>
      </div>
    );
  }

  if ((isLoading || isInitialLoad) && events.length === 0) {
    return <EventSkeleton skeletonKeys={skeletonKeys} />;
  }

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <Filter className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">No events found</h3>
        <p className="text-sm text-muted-foreground">
          Try adjusting your filters or search terms to find more events.
        </p>
        {hasFilters && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="mt-4"
          >
            Clear filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {events.map((event) => (
          <ExploreEventCard
            key={event.id}
            id={event.id}
            name={event.name}
            date={event.date}
            city={event.city}
            country={event.country}
            activity={event.activity}
            photoCount={event.photoCount}
            coverUrl={event.coverUrl}
            pricePerPhoto={event.pricePerPhoto}
            linkPrefix={eventLinkPrefix}
          />
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <Button type="button" variant="outline" onClick={onLoadMore} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load more'
            )}
          </Button>
        </div>
      )}
    </>
  );
}
