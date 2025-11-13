"use client";

import { Filter, Loader2, Search, X } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { activityOptions } from "@/app/dashboard/photographer/events/new/activity-options";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
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
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(
    new Set(),
  );
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [sortBy, setSortBy] = useState<
    "date_asc" | "date_desc" | "name_asc" | "name_desc"
  >("date_desc");
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, startTransition] = useTransition();
  const [page, setPage] = useState(0);

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

  useEffect(() => {
    setPage(0);
    startTransition(async () => {
      try {
        const result = await searchEventsAction({
          searchText: debouncedSearch.trim() || undefined,
          activities:
            selectedActivities.size > 0
              ? Array.from(selectedActivities)
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
      } catch (error) {
        console.error("Error searching events:", error);
        // Set empty state on error
        setEvents([]);
        setTotal(0);
      }
    });
  }, [
    debouncedSearch,
    selectedActivities,
    selectedCity,
    selectedCountry,
    sortBy,
  ]);

  const hasMore = events.length < total;
  const hasFilters =
    selectedActivities.size > 0 ||
    (selectedCity && selectedCity !== "all") ||
    (selectedCountry && selectedCountry !== "all");

  const toggleActivity = (activity: string) => {
    setSelectedActivities((prev) => {
      const next = new Set(prev);
      if (next.has(activity)) {
        next.delete(activity);
      } else {
        next.add(activity);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setSelectedActivities(new Set());
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
              selectedActivities.size > 0
                ? Array.from(selectedActivities)
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
      {/* Search Bar */}
      <div className="relative">
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

      {/* Filters */}
      <div className="space-y-4">
        {/* Activity Filters */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label className="text-sm font-medium">Activity</Label>
            {hasFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7 text-xs"
              >
                Clear all
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {activityOptions.map((option) => {
              const isSelected = selectedActivities.has(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleActivity(option.value)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background hover:bg-accent",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Location and Sort Filters */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
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

          <div>
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

          <div>
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
        </div>
      </div>

      {/* Results */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {isLoading && events.length === 0 ? (
              "Searching..."
            ) : (
              <>
                {total} {total === 1 ? "event" : "events"} found
              </>
            )}
          </div>
        </div>

        {isLoading && events.length === 0 ? (
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
