"use client";

import { Filter, Loader2, Search, X } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
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
}: {
  initialFilterOptions: FilterOptions;
}) {
  const [searchText, setSearchText] = useState("");
  const [selectedActivity, setSelectedActivity] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [sortBy, setSortBy] = useState<
    "date_asc" | "date_desc" | "name_asc" | "name_desc"
  >("date_desc");
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, startTransition] = useTransition();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [page, setPage] = useState(0);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const debouncedSearch = useDebounce(searchText, 300);
  const limit = 20;

  const filterOptions = useMemo(
    () => initialFilterOptions,
    [initialFilterOptions],
  );

  const skeletonKeys = useMemo(
    () => Array.from({ length: 8 }, (_, i) => `skeleton-${i}`),
    [],
  );

  // Sort activity options alphabetically by label
  const sortedActivityOptions = useMemo(() => {
    return [...activityOptions].sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  useEffect(() => {
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
        // Set empty state on error
        setEvents([]);
        setTotal(0);
        setIsInitialLoad(false);
      }
    });
  }, [
    debouncedSearch,
    selectedActivity,
    selectedCity,
    selectedCountry,
    sortBy,
  ]);

  const hasMore = events.length < total;
  const hasFilters =
    (selectedActivity && selectedActivity !== "all") ||
    (selectedCity && selectedCity !== "all") ||
    (selectedCountry && selectedCountry !== "all");

  const activeFilterCount =
    (selectedActivity !== "all" ? 1 : 0) +
    (selectedCity !== "all" ? 1 : 0) +
    (selectedCountry !== "all" ? 1 : 0);

  const clearFilters = () => {
    setSelectedActivity("all");
    setSelectedCity("all");
    setSelectedCountry("all");
    setSearchText("");
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

  return (
    <div className="space-y-6">
      {/* Search Bar and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search events by name, city, or country..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
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
            <div className="space-y-4 py-4">
              {/* Activity Filter */}
              <div className="w-full">
                <Label
                  htmlFor="activity-filter-mobile"
                  className="mb-2 block text-sm font-medium"
                >
                  Activity
                </Label>
                <Select
                  value={selectedActivity}
                  onValueChange={setSelectedActivity}
                >
                  <SelectTrigger id="activity-filter-mobile" className="w-full">
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

              {/* City Filter */}
              <div className="w-full">
                <Label
                  htmlFor="city-filter-mobile"
                  className="mb-2 block text-sm font-medium"
                >
                  City
                </Label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger id="city-filter-mobile" className="w-full">
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

              {/* Country Filter */}
              <div className="w-full">
                <Label
                  htmlFor="country-filter-mobile"
                  className="mb-2 block text-sm font-medium"
                >
                  Country
                </Label>
                <Select
                  value={selectedCountry}
                  onValueChange={setSelectedCountry}
                >
                  <SelectTrigger id="country-filter-mobile" className="w-full">
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

              {/* Sort Filter */}
              <div className="w-full">
                <Label
                  htmlFor="sort-filter-mobile"
                  className="mb-2 block text-sm font-medium"
                >
                  Sort by
                </Label>
                <Select
                  value={sortBy}
                  onValueChange={(value) =>
                    setSortBy(
                      value as
                        | "date_asc"
                        | "date_desc"
                        | "name_asc"
                        | "name_desc",
                    )
                  }
                >
                  <SelectTrigger id="sort-filter-mobile" className="w-full">
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

              {/* Clear Filters Button */}
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
          </DialogContent>
        </Dialog>

        {/* Desktop Filters - Activity, Location and Sort Filters */}
        <div className="hidden sm:flex sm:flex-wrap sm:items-end sm:gap-4">
          <div className="">
            <Label
              htmlFor="activity-filter"
              className="mb-2 block text-sm font-medium"
            >
              Activity
            </Label>
            <Select
              value={selectedActivity}
              onValueChange={setSelectedActivity}
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

          <div className="">
            <Label
              htmlFor="city-filter"
              className="mb-2 block text-sm font-medium"
            >
              City
            </Label>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
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

          <div className="">
            <Label
              htmlFor="country-filter"
              className="mb-2 block text-sm font-medium"
            >
              Country
            </Label>
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
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

          <div className="">
            <Label
              htmlFor="sort-filter"
              className="mb-2 block text-sm font-medium"
            >
              Sort by
            </Label>
            <Select
              value={sortBy}
              onValueChange={(value) =>
                setSortBy(
                  value as "date_asc" | "date_desc" | "name_asc" | "name_desc",
                )
              }
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

      {/* Results */}
      <div>
        {isLoading && (events.length === 0 || isInitialLoad) ? (
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
          <div className="rounded-xl border border-dashed p-12 text-center">
            <Filter className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
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
    </div>
  );
}
