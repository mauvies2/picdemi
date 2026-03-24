import { EventSearchBar } from '@/components/event-search-bar';
import { getFilterOptionsAction } from './actions';
import { ExplorePageContent } from './explore-page-content';

export default async function TalentExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ where?: string; activity?: string }>;
}) {
  const { where, activity } = await searchParams;
  const filterOptions = await getFilterOptionsAction();

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <EventSearchBar
          key={`${where ?? ''}-${activity ?? ''}`}
          variant="hero"
          initialWhere={where ?? ''}
          initialActivity={activity ?? ''}
          searchHref="/dashboard/talent/events"
        />
      </div>

      <ExplorePageContent
        key={`${where ?? ''}-${activity ?? ''}`}
        initialFilterOptions={filterOptions}
        loadOnMount={true}
        initialWhere={where}
        initialActivity={activity}
        hideTopFilters={true}
        clearHref="/dashboard/talent/events"
      />
    </div>
  );
}
