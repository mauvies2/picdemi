import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { activityOptions } from '@/app/dashboard/photographer/events/new/activity-options';
import { searchEventsAction } from '@/app/dashboard/talent/events/actions';
import { useDebounce } from '@/hooks/use-debounce';

export type FilterOptions = {
  cities: string[];
  countries: string[];
};

export type EventWithStats = {
  id: string;
  name: string;
  date: string;
  city: string;
  country: string;
  activity: string;
  photoCount: number;
  coverUrl: string | null;
  pricePerPhoto: number | null;
};

export type SortBy = 'date_asc' | 'date_desc' | 'name_asc' | 'name_desc';

type UseEventSearchOptions = {
  initialFilterOptions: FilterOptions;
  initialWhere?: string;
  initialActivity?: string;
  initialDateFrom?: string;
  initialDateTo?: string;
  loadOnMount?: boolean;
  enableLocation?: boolean;
  clearHref?: string;
};

const LIMIT = 20;

export function useEventSearch({
  initialFilterOptions,
  initialWhere,
  initialActivity,
  initialDateFrom,
  initialDateTo,
  loadOnMount = false,
  enableLocation = false,
  clearHref,
}: UseEventSearchOptions) {
  const router = useRouter();

  const [searchText, setSearchText] = useState<string>(() => {
    if (!initialWhere) return '';
    const matchedCity = initialFilterOptions.cities.find(
      (c) => c.toLowerCase() === initialWhere.toLowerCase(),
    );
    const matchedCountry = initialFilterOptions.countries.find(
      (c) => c.toLowerCase() === initialWhere.toLowerCase(),
    );
    return matchedCity || matchedCountry ? '' : initialWhere;
  });

  const [selectedActivity, setSelectedActivity] = useState<string>(initialActivity || 'all');

  const [selectedCity, setSelectedCity] = useState<string>(() => {
    if (!initialWhere) return 'all';
    return (
      initialFilterOptions.cities.find((c) => c.toLowerCase() === initialWhere.toLowerCase()) ??
      'all'
    );
  });

  const [selectedCountry, setSelectedCountry] = useState<string>(() => {
    if (!initialWhere) return 'all';
    return (
      initialFilterOptions.countries.find((c) => c.toLowerCase() === initialWhere.toLowerCase()) ??
      'all'
    );
  });

  const [sortBy, setSortBy] = useState<SortBy>('date_desc');
  const [dateFrom, setDateFrom] = useState(initialDateFrom ?? '');
  const [dateTo, setDateTo] = useState(initialDateTo ?? '');
  const [photographerQuery, setPhotographerQuery] = useState('');
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, startTransition] = useTransition();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  // Don't auto-search when waiting for geolocation — wait until location resolves or fails
  const [hasSearched, setHasSearched] = useState(loadOnMount && !enableLocation);
  const [page, setPage] = useState(0);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [locationApplied, setLocationApplied] = useState(false);
  const locationRequested = useRef(false);

  const [filterOptions, setFilterOptions] = useState(initialFilterOptions);

  const debouncedSearch = useDebounce(searchText, 300);

  const locationLabel = initialWhere
    ? initialWhere
    : locationApplied
      ? [
          selectedCity !== 'all' ? selectedCity : null,
          selectedCountry !== 'all' ? selectedCountry : null,
        ]
          .filter(Boolean)
          .join(', ')
      : null;

  const skeletonKeys = useMemo(() => Array.from({ length: 4 }, (_, i) => `skeleton-${i}`), []);

  const sortedActivityOptions = useMemo(
    () => [...activityOptions].sort((a, b) => a.label.localeCompare(b.label)),
    [],
  );

  // Geolocation
  useEffect(() => {
    if (!enableLocation || locationRequested.current) return;
    if (!navigator.geolocation) return;
    locationRequested.current = true;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { 'Accept-Language': 'en' } },
          );
          if (!res.ok) return;
          const data = await res.json();
          const rawCity: string =
            data.address?.city ?? data.address?.town ?? data.address?.village ?? '';
          const rawCountry: string = data.address?.country ?? '';

          if (!rawCity && !rawCountry) return;

          const resolvedCity = rawCity
            ? (filterOptions.cities.find((c) => c.toLowerCase() === rawCity.toLowerCase()) ??
              rawCity)
            : null;
          const resolvedCountry = rawCountry
            ? (filterOptions.countries.find((c) => c.toLowerCase() === rawCountry.toLowerCase()) ??
              rawCountry)
            : null;

          setFilterOptions((prev) => ({
            cities:
              resolvedCity && !prev.cities.includes(resolvedCity)
                ? [...prev.cities, resolvedCity].sort()
                : prev.cities,
            countries:
              resolvedCountry && !prev.countries.includes(resolvedCountry)
                ? [...prev.countries, resolvedCountry].sort()
                : prev.countries,
          }));

          if (resolvedCity) setSelectedCity(resolvedCity);
          if (resolvedCountry) setSelectedCountry(resolvedCountry);
          setLocationApplied(true);
          setHasSearched(true);

          const locationName = resolvedCity ?? resolvedCountry ?? '';
          if (locationName && clearHref) {
            router.replace(`${clearHref}?where=${encodeURIComponent(locationName)}`);
          }
        } catch {
          // Silently ignore reverse geocoding errors
        }
      },
      () => {
        // Permission denied or error — fall back to showing all events
        setHasSearched(true);
      },
    );
  }, [enableLocation, filterOptions.cities, filterOptions.countries, clearHref, router]);

  // Search
  // biome-ignore lint/correctness/useExhaustiveDependencies: searchTrigger is an imperative counter, not a reactive value
  useEffect(() => {
    if (!hasSearched) {
      setIsInitialLoad(false);
      return;
    }
    setPage(0);
    startTransition(async () => {
      try {
        const result = await searchEventsAction({
          searchText: debouncedSearch.trim() || undefined,
          activities:
            selectedActivity && selectedActivity !== 'all' ? [selectedActivity] : undefined,
          cities: selectedCity && selectedCity !== 'all' ? [selectedCity] : undefined,
          countries: selectedCountry && selectedCountry !== 'all' ? [selectedCountry] : undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          sortBy,
          limit: LIMIT,
          offset: 0,
          photographerQuery: photographerQuery.trim() || undefined,
        });
        setEvents(
          result.events.map((e) => ({
            ...e,
            pricePerPhoto: e.price_per_photo,
          })),
        );
        setPage(0);
        setTotal(result.total);
        setIsInitialLoad(false);
      } catch (error) {
        console.error('Error searching events:', error);
        setEvents([]);
        setTotal(0);
        setIsInitialLoad(false);
      }
    });
  }, [
    hasSearched,
    debouncedSearch,
    selectedActivity,
    selectedCity,
    selectedCountry,
    dateFrom,
    dateTo,
    sortBy,
    searchTrigger,
    photographerQuery,
  ]);

  const hasMore = events.length < total;

  const hasFilters =
    (selectedActivity && selectedActivity !== 'all') ||
    (selectedCity && selectedCity !== 'all') ||
    (selectedCountry && selectedCountry !== 'all') ||
    !!dateFrom ||
    !!dateTo ||
    !!photographerQuery;

  const activeFilterCount =
    (selectedActivity !== 'all' ? 1 : 0) +
    (selectedCity !== 'all' ? 1 : 0) +
    (selectedCountry !== 'all' ? 1 : 0) +
    (dateFrom || dateTo ? 1 : 0) +
    (photographerQuery ? 1 : 0);

  // Used as the badge count on the simplified-mode Filters button
  const dateFilterCount = (dateFrom || dateTo ? 1 : 0) + (photographerQuery ? 1 : 0);

  const clearFilters = () => {
    setSelectedActivity('all');
    setSelectedCity('all');
    setSelectedCountry('all');
    setSearchText('');
    setDateFrom('');
    setDateTo('');
    setPhotographerQuery('');
    setLocationApplied(false);
    setHasSearched(loadOnMount);
    if (!loadOnMount) setEvents([]);
  };

  const clearDateFilters = () => {
    setDateFrom('');
    setDateTo('');
  };

  const handleFilterChange = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setHasSearched(true);
  };

  const loadMore = () => {
    if (isLoading || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    startTransition(async () => {
      try {
        const result = await searchEventsAction({
          searchText: debouncedSearch.trim() || undefined,
          activities:
            selectedActivity && selectedActivity !== 'all' ? [selectedActivity] : undefined,
          cities: selectedCity && selectedCity !== 'all' ? [selectedCity] : undefined,
          countries: selectedCountry && selectedCountry !== 'all' ? [selectedCountry] : undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          sortBy,
          limit: LIMIT,
          offset: nextPage * LIMIT,
          photographerQuery: photographerQuery.trim() || undefined,
        });
        setEvents((prev) => [
          ...prev,
          ...result.events.map((e) => ({
            ...e,
            pricePerPhoto: e.price_per_photo,
          })),
        ]);
        setTotal(result.total);
      } catch (error) {
        console.error('Error loading more events:', error);
      }
    });
  };

  const triggerSearch = () => {
    setHasSearched(true);
    setSearchTrigger((n) => n + 1);
  };

  return {
    // State
    searchText,
    setSearchText,
    selectedActivity,
    setSelectedActivity,
    selectedCity,
    setSelectedCity,
    selectedCountry,
    setSelectedCountry,
    sortBy,
    setSortBy,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    photographerQuery,
    setPhotographerQuery,
    events,
    total,
    isLoading,
    isInitialLoad,
    hasSearched,
    setHasSearched,
    filterOptions,
    sortedActivityOptions,
    isFilterModalOpen,
    setIsFilterModalOpen,
    // Computed
    locationLabel,
    hasMore,
    hasFilters,
    activeFilterCount,
    dateFilterCount,
    skeletonKeys,
    // Actions
    clearFilters,
    clearDateFilters,
    handleFilterChange,
    loadMore,
    triggerSearch,
  };
}
