'use client';

import type { FilterOptions } from '@/hooks/use-event-search';
import { useEventSearch } from '@/hooks/use-event-search';
import { EventFilterBar } from './components/event-filter-bar';
import { EventGrid } from './components/event-grid';
import { EventInfoCards } from './components/event-info-cards';

export function ExplorePageContent({
  initialFilterOptions,
  eventLinkPrefix,
  showInfoCards = false,
  loadOnMount = false,
  enableLocation = false,
  initialWhere,
  initialActivity,
  initialDateFrom,
  initialDateTo,
  hideTopFilters = false,
  clearHref,
}: {
  initialFilterOptions: FilterOptions;
  eventLinkPrefix?: string;
  showInfoCards?: boolean;
  loadOnMount?: boolean;
  enableLocation?: boolean;
  initialWhere?: string;
  initialActivity?: string;
  initialDateFrom?: string;
  initialDateTo?: string;
  hideTopFilters?: boolean;
  clearHref?: string;
}) {
  const search = useEventSearch({
    initialFilterOptions,
    initialWhere,
    initialActivity,
    initialDateFrom,
    initialDateTo,
    loadOnMount,
    enableLocation,
    clearHref,
  });

  return (
    <div className="space-y-3">
      <EventFilterBar
        hideTopFilters={hideTopFilters}
        searchText={search.searchText}
        setSearchText={search.setSearchText}
        triggerSearch={search.triggerSearch}
        selectedActivity={search.selectedActivity}
        setSelectedActivity={search.setSelectedActivity}
        selectedCity={search.selectedCity}
        setSelectedCity={search.setSelectedCity}
        selectedCountry={search.selectedCountry}
        setSelectedCountry={search.setSelectedCountry}
        sortBy={search.sortBy}
        setSortBy={search.setSortBy}
        dateFrom={search.dateFrom}
        setDateFrom={search.setDateFrom}
        dateTo={search.dateTo}
        setDateTo={search.setDateTo}
        filterOptions={search.filterOptions}
        sortedActivityOptions={search.sortedActivityOptions}
        locationLabel={search.locationLabel}
        hasFilters={search.hasFilters}
        activeFilterCount={search.activeFilterCount}
        dateFilterCount={search.dateFilterCount}
        isFilterModalOpen={search.isFilterModalOpen}
        setIsFilterModalOpen={search.setIsFilterModalOpen}
        handleFilterChange={search.handleFilterChange}
        clearFilters={search.clearFilters}
        clearDateFilters={search.clearDateFilters}
        setHasSearched={search.setHasSearched}
      />

      <EventGrid
        events={search.events}
        isLoading={search.isLoading}
        isInitialLoad={search.isInitialLoad}
        hasSearched={search.hasSearched}
        hasMore={search.hasMore}
        hasFilters={search.hasFilters}
        enableLocation={enableLocation}
        skeletonKeys={search.skeletonKeys}
        eventLinkPrefix={eventLinkPrefix}
        onLoadMore={search.loadMore}
        onClearFilters={search.clearFilters}
      />

      {showInfoCards && <EventInfoCards />}
    </div>
  );
}
