"use client";

import {
  Filter,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  UserCircle2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { activityOptions } from "@/app/dashboard/photographer/events/new/activity-options";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import { searchEventsAction } from "./actions";
import { ExploreEventCard } from "./explore-event-card";

type FilterOptions = {
  cities: string[];
  countries: string[];
};

type EventWithStats = {
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
  const [searchText, setSearchText] = useState<string>(() => {
    if (!initialWhere) return "";
    const matchedCity = initialFilterOptions.cities.find(
      (c) => c.toLowerCase() === initialWhere.toLowerCase(),
    );
    const matchedCountry = initialFilterOptions.countries.find(
      (c) => c.toLowerCase() === initialWhere.toLowerCase(),
    );
    return matchedCity || matchedCountry ? "" : initialWhere;
  });

  const [selectedActivity, setSelectedActivity] = useState<string>(
    initialActivity || "all",
  );

  const [selectedCity, setSelectedCity] = useState<string>(() => {
    if (!initialWhere) return "all";
    return (
      initialFilterOptions.cities.find(
        (c) => c.toLowerCase() === initialWhere.toLowerCase(),
      ) ?? "all"
    );
  });

  const [selectedCountry, setSelectedCountry] = useState<string>(() => {
    if (!initialWhere) return "all";
    return (
      initialFilterOptions.countries.find(
        (c) => c.toLowerCase() === initialWhere.toLowerCase(),
      ) ?? "all"
    );
  });

  const [sortBy, setSortBy] = useState<
    "date_asc" | "date_desc" | "name_asc" | "name_desc"
  >("date_desc");
  const [dateFrom, setDateFrom] = useState(initialDateFrom ?? "");
  const [dateTo, setDateTo] = useState(initialDateTo ?? "");
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, startTransition] = useTransition();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  // Don't auto-search when waiting for geolocation — wait until location resolves or fails
  const [hasSearched, setHasSearched] = useState(
    loadOnMount && !enableLocation,
  );
  const [page, setPage] = useState(0);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [locationApplied, setLocationApplied] = useState(false);
  const locationRequested = useRef(false);

  const router = useRouter();
  const debouncedSearch = useDebounce(searchText, 300);
  const limit = 20;

  const [filterOptions, setFilterOptions] = useState(initialFilterOptions);

  // Unified location label for the results header
  const locationLabel = initialWhere
    ? initialWhere
    : locationApplied
      ? [
          selectedCity !== "all" ? selectedCity : null,
          selectedCountry !== "all" ? selectedCountry : null,
        ]
          .filter(Boolean)
          .join(", ")
      : null;

  const skeletonKeys = useMemo(
    () => Array.from({ length: 8 }, (_, i) => `skeleton-${i}`),
    [],
  );

  const sortedActivityOptions = useMemo(() => {
    return [...activityOptions].sort((a, b) => a.label.localeCompare(b.label));
  }, []);

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
            { headers: { "Accept-Language": "en" } },
          );
          if (!res.ok) return;
          const data = await res.json();
          const rawCity: string =
            data.address?.city ??
            data.address?.town ??
            data.address?.village ??
            "";
          const rawCountry: string = data.address?.country ?? "";

          if (!rawCity && !rawCountry) return;

          const resolvedCity = rawCity
            ? (filterOptions.cities.find(
                (c) => c.toLowerCase() === rawCity.toLowerCase(),
              ) ?? rawCity)
            : null;
          const resolvedCountry = rawCountry
            ? (filterOptions.countries.find(
                (c) => c.toLowerCase() === rawCountry.toLowerCase(),
              ) ?? rawCountry)
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

          const locationName = resolvedCity ?? resolvedCountry ?? "";
          if (locationName && clearHref) {
            router.replace(
              `${clearHref}?where=${encodeURIComponent(locationName)}`,
            );
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
  }, [
    enableLocation,
    filterOptions.cities,
    filterOptions.countries,
    clearHref,
    router,
  ]);

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
            selectedActivity && selectedActivity !== "all"
              ? [selectedActivity]
              : undefined,
          cities:
            selectedCity && selectedCity !== "all" ? [selectedCity] : undefined,
          countries:
            selectedCountry && selectedCountry !== "all"
              ? [selectedCountry]
              : undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          sortBy,
          limit,
          offset: 0,
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
        console.error("Error searching events:", error);
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
  ]);

  const hasMore = events.length < total;
  const hasFilters =
    (selectedActivity && selectedActivity !== "all") ||
    (selectedCity && selectedCity !== "all") ||
    (selectedCountry && selectedCountry !== "all") ||
    !!dateFrom ||
    !!dateTo;

  const activeFilterCount =
    (selectedActivity !== "all" ? 1 : 0) +
    (selectedCity !== "all" ? 1 : 0) +
    (selectedCountry !== "all" ? 1 : 0) +
    (dateFrom || dateTo ? 1 : 0);

  const clearFilters = () => {
    setSelectedActivity("all");
    setSelectedCity("all");
    setSelectedCountry("all");
    setSearchText("");
    setDateFrom("");
    setDateTo("");
    setLocationApplied(false);
    setHasSearched(loadOnMount);
    if (!loadOnMount) setEvents([]);
  };

  const clearDateFilters = () => {
    setDateFrom("");
    setDateTo("");
  };

  const handleFilterChange =
    (setter: (v: string) => void) => (value: string) => {
      setter(value);
      setHasSearched(true);
    };

  const loadMore = () => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      startTransition(async () => {
        try {
          const result = await searchEventsAction({
            searchText: debouncedSearch.trim() || undefined,
            activities:
              selectedActivity && selectedActivity !== "all"
                ? [selectedActivity]
                : undefined,
            cities:
              selectedCity && selectedCity !== "all"
                ? [selectedCity]
                : undefined,
            countries:
              selectedCountry && selectedCountry !== "all"
                ? [selectedCountry]
                : undefined,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
            sortBy,
            limit,
            offset: nextPage * limit,
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
          console.error("Error loading more events:", error);
        }
      });
    }
  };

  // Simplified modal (date only) used when hideTopFilters=true
  const simplifiedFilterDialogContent = (
    <div className="space-y-4 py-4">
      <div className="w-full">
        <Label className="mb-2 block text-sm font-medium">Date range</Label>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setHasSearched(true);
            }}
            className="flex-1"
          />
          <span className="text-muted-foreground text-sm">to</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setHasSearched(true);
            }}
            className="flex-1"
          />
        </div>
      </div>
      {(dateFrom || dateTo) && (
        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              clearDateFilters();
              setIsFilterModalOpen(false);
            }}
            className="w-full"
          >
            Clear dates
          </Button>
        </div>
      )}
    </div>
  );

  // Full modal used when hideTopFilters=false (dashboard)
  const fullFilterDialogContent = (
    <div className="space-y-4 py-4">
      <div className="w-full">
        <Label
          htmlFor="activity-filter-modal"
          className="mb-2 block text-sm font-medium"
        >
          Activity
        </Label>
        <Select
          value={selectedActivity}
          onValueChange={handleFilterChange(setSelectedActivity)}
        >
          <SelectTrigger id="activity-filter-modal" className="w-full">
            <SelectValue placeholder="All activities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All activities</SelectItem>
            {sortedActivityOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full">
        <Label
          htmlFor="city-filter-modal"
          className="mb-2 block text-sm font-medium"
        >
          City
        </Label>
        <Select
          value={selectedCity}
          onValueChange={handleFilterChange(setSelectedCity)}
        >
          <SelectTrigger id="city-filter-modal" className="w-full">
            <SelectValue placeholder="All cities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cities</SelectItem>
            {filterOptions.cities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full">
        <Label
          htmlFor="country-filter-modal"
          className="mb-2 block text-sm font-medium"
        >
          Country
        </Label>
        <Select
          value={selectedCountry}
          onValueChange={handleFilterChange(setSelectedCountry)}
        >
          <SelectTrigger id="country-filter-modal" className="w-full">
            <SelectValue placeholder="All countries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All countries</SelectItem>
            {filterOptions.countries.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full">
        <Label
          htmlFor="sort-filter-modal"
          className="mb-2 block text-sm font-medium"
        >
          Sort by
        </Label>
        <Select
          value={sortBy}
          onValueChange={(value) => {
            setSortBy(
              value as "date_asc" | "date_desc" | "name_asc" | "name_desc",
            );
            setHasSearched(true);
          }}
        >
          <SelectTrigger id="sort-filter-modal" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_desc">Newest first</SelectItem>
            <SelectItem value="date_asc">Oldest first</SelectItem>
            <SelectItem value="name_asc">Name (A-Z)</SelectItem>
            <SelectItem value="name_desc">Name (Z-A)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-full">
        <Label className="mb-2 block text-sm font-medium">Date range</Label>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setHasSearched(true);
            }}
            className="flex-1"
          />
          <span className="text-muted-foreground text-sm">to</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setHasSearched(true);
            }}
            className="flex-1"
          />
        </div>
      </div>

      {hasFilters && (
        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              clearFilters();
              setIsFilterModalOpen(false);
            }}
            className="w-full"
          >
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );

  const dateFilterCount = dateFrom || dateTo ? 1 : 0;

  return (
    <div className="space-y-3">
      {/* Search Bar and Filters */}
      {hideTopFilters ? (
        <div className="flex items-end justify-between gap-3 flex-wrap">
          {/* Left: location label */}
          <div className="flex items-center gap-1.5 min-w-0">
            {locationLabel ? (
              <>
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm text-muted-foreground truncate">
                  Showing events near{" "}
                  <span className="font-medium text-foreground">
                    {locationLabel}
                  </span>
                </span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">
                {hasSearched && total > 0
                  ? `${total} event${total === 1 ? "" : "s"} found`
                  : null}
              </span>
            )}
          </div>

          {/* Right: Filters + Sort */}
          <div className="flex items-center gap-2 shrink-0">
            <Dialog
              open={isFilterModalOpen}
              onOpenChange={setIsFilterModalOpen}
            >
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="flex h-9 items-center gap-2 rounded-full border px-3 text-sm font-medium hover:bg-muted transition-colors"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {dateFilterCount > 0 && (
                    <span className="rounded-full bg-primary text-primary-foreground px-1.5 py-0.5 text-xs font-medium">
                      {dateFilterCount}
                    </span>
                  )}
                </button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Filters</DialogTitle>
                </DialogHeader>
                {simplifiedFilterDialogContent}
              </DialogContent>
            </Dialog>

            <Select
              value={sortBy}
              onValueChange={(value) => {
                setSortBy(value as typeof sortBy);
                setHasSearched(true);
              }}
            >
              <SelectTrigger className="h-9 w-auto rounded-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Newest first</SelectItem>
                <SelectItem value="date_asc">Oldest first</SelectItem>
                <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                <SelectItem value="name_desc">Name (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          {/* Search Bar */}
          <div className="relative flex flex-1 min-w-0 gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search events by name, city, or country..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (searchText.trim() || hasFilters)) {
                    setHasSearched(true);
                    setSearchTrigger((n) => n + 1);
                  }
                }}
                className="pl-9 pr-9"
              />
              {searchText && (
                <button
                  type="button"
                  onClick={() => setSearchText("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              type="button"
              disabled={searchText.trim() === "" && !hasFilters}
              onClick={() => {
                setHasSearched(true);
                setSearchTrigger((n) => n + 1);
              }}
              className="shrink-0"
            >
              <Search className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Search</span>
            </Button>
          </div>

          {/* Mobile Filter Button */}
          <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="sm:hidden h-10 gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 rounded-full bg-primary text-primary-foreground px-1.5 py-0.5 text-xs font-medium">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Filters</DialogTitle>
              </DialogHeader>
              {fullFilterDialogContent}
            </DialogContent>
          </Dialog>

          {/* Desktop Filters */}
          <div className="hidden sm:flex sm:flex-wrap sm:items-end sm:gap-4">
            <div>
              <Label
                htmlFor="activity-filter"
                className="mb-2 block text-sm font-medium"
              >
                Activity
              </Label>
              <Select
                value={selectedActivity}
                onValueChange={handleFilterChange(setSelectedActivity)}
              >
                <SelectTrigger id="activity-filter">
                  <SelectValue placeholder="All activities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All activities</SelectItem>
                  {sortedActivityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label
                htmlFor="city-filter"
                className="mb-2 block text-sm font-medium"
              >
                City
              </Label>
              <Select
                value={selectedCity}
                onValueChange={handleFilterChange(setSelectedCity)}
              >
                <SelectTrigger id="city-filter">
                  <SelectValue placeholder="All cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All cities</SelectItem>
                  {filterOptions.cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label
                htmlFor="country-filter"
                className="mb-2 block text-sm font-medium"
              >
                Country
              </Label>
              <Select
                value={selectedCountry}
                onValueChange={handleFilterChange(setSelectedCountry)}
              >
                <SelectTrigger id="country-filter">
                  <SelectValue placeholder="All countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All countries</SelectItem>
                  {filterOptions.countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label
                htmlFor="sort-filter"
                className="mb-2 block text-sm font-medium"
              >
                Sort by
              </Label>
              <Select
                value={sortBy}
                onValueChange={(value) => {
                  setSortBy(
                    value as
                      | "date_asc"
                      | "date_desc"
                      | "name_asc"
                      | "name_desc",
                  );
                  setHasSearched(true);
                }}
              >
                <SelectTrigger id="sort-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_desc">Newest first</SelectItem>
                  <SelectItem value="date_asc">Oldest first</SelectItem>
                  <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block text-sm font-medium">From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setHasSearched(true);
                }}
                className="h-10"
              />
            </div>

            <div>
              <Label className="mb-2 block text-sm font-medium">To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setHasSearched(true);
                }}
                className="h-10"
              />
            </div>

            {hasFilters && (
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={clearFilters}
                  className="h-10"
                >
                  Clear all
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      <div>
        {!hasSearched ? (
          enableLocation ? (
            // Show skeleton while waiting for geolocation to resolve
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {skeletonKeys.map((key) => (
                <div key={key} className="space-y-2">
                  <div className="aspect-square w-full animate-pulse rounded-lg bg-muted" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-10 text-center">
              <Search className="mx-auto mb-4 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Enter an event name above and click <strong>Search</strong> to
                find your photos.
              </p>
            </div>
          )
        ) : (isLoading || isInitialLoad) && events.length === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {skeletonKeys.map((key) => (
              <div key={key} className="space-y-2">
                <div className="aspect-square w-full animate-pulse rounded-lg bg-muted" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
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
                onClick={clearFilters}
                className="mt-4"
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={loadMore}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load more"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      {showInfoCards && (
        <div className="my-6 grid gap-3 sm:grid-cols-2">
          {/* Account nudge */}
          <div className="flex items-start gap-3 rounded-xl border bg-card p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <UserCircle2 className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Save photos forever</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Create a free account to keep purchased photos in your library
                permanently.
              </p>
              <div className="mt-2 flex gap-2">
                <Link href="/login">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-3"
                  >
                    Log in
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="h-7 text-xs px-3">
                    Sign up free
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* AI matching — coming soon */}
          <div className="flex items-start gap-3 rounded-xl border bg-card p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">AI face matching</p>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Coming soon
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Upload a selfie and let AI instantly find photos of you across
                thousands of event shots.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
