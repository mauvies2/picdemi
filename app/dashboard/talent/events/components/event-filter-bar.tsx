'use client';

import { Filter, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FilterOptions, SortBy } from '@/hooks/use-event-search';

type ActivityOption = { value: string; label: string };

type EventFilterBarProps = {
  // Mode
  hideTopFilters: boolean;
  // Text search (full mode only)
  searchText: string;
  setSearchText: (v: string) => void;
  triggerSearch: () => void;
  // Filters
  selectedActivity: string;
  setSelectedActivity: (v: string) => void;
  selectedCity: string;
  setSelectedCity: (v: string) => void;
  selectedCountry: string;
  setSelectedCountry: (v: string) => void;
  sortBy: SortBy;
  setSortBy: (v: SortBy) => void;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  // Options
  filterOptions: FilterOptions;
  sortedActivityOptions: ActivityOption[];
  // Computed
  locationLabel: string | null;
  hasFilters: boolean;
  activeFilterCount: number;
  dateFilterCount: number;
  // Modal
  isFilterModalOpen: boolean;
  setIsFilterModalOpen: (v: boolean) => void;
  // Actions
  handleFilterChange: (setter: (v: string) => void) => (value: string) => void;
  clearFilters: () => void;
  clearDateFilters: () => void;
  setHasSearched: (v: boolean) => void;
};

export function EventFilterBar({
  hideTopFilters,
  searchText,
  setSearchText,
  triggerSearch,
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
  filterOptions,
  sortedActivityOptions,
  locationLabel,
  hasFilters,
  activeFilterCount,
  dateFilterCount,
  isFilterModalOpen,
  setIsFilterModalOpen,
  handleFilterChange,
  clearFilters,
  clearDateFilters,
  setHasSearched,
}: EventFilterBarProps) {
  const simplifiedModalContent = (
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
          <span className="text-sm text-muted-foreground">to</span>
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

  const fullModalContent = (
    <div className="space-y-4 py-4">
      <div className="w-full">
        <Label htmlFor="activity-filter-modal" className="mb-2 block text-sm font-medium">
          Activity
        </Label>
        <Select value={selectedActivity} onValueChange={handleFilterChange(setSelectedActivity)}>
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
        <Label htmlFor="city-filter-modal" className="mb-2 block text-sm font-medium">
          City
        </Label>
        <Select value={selectedCity} onValueChange={handleFilterChange(setSelectedCity)}>
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
        <Label htmlFor="country-filter-modal" className="mb-2 block text-sm font-medium">
          Country
        </Label>
        <Select value={selectedCountry} onValueChange={handleFilterChange(setSelectedCountry)}>
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
        <Label htmlFor="sort-filter-modal" className="mb-2 block text-sm font-medium">
          Sort by
        </Label>
        <Select
          value={sortBy}
          onValueChange={(value) => {
            setSortBy(value as SortBy);
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
          <span className="text-sm text-muted-foreground">to</span>
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

  if (hideTopFilters) {
    return (
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          {locationLabel ? (
            <span className="truncate text-sm text-muted-foreground">
              Showing events near{' '}
              <span className="font-medium text-foreground">{locationLabel}</span>
            </span>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="flex h-9 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                <Filter className="h-4 w-4" />
                Filters
                {dateFilterCount > 0 && (
                  <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
                    {dateFilterCount}
                  </span>
                )}
              </button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Filters</DialogTitle>
              </DialogHeader>
              {simplifiedModalContent}
            </DialogContent>
          </Dialog>

          <Select
            value={sortBy}
            onValueChange={(value) => {
              setSortBy(value as SortBy);
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
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      {/* Text search */}
      <div className="relative flex min-w-0 flex-1 gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search events by name, city, or country..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (searchText.trim() || hasFilters)) {
                triggerSearch();
              }
            }}
            className="pl-9 pr-9"
          />
          {searchText && (
            <button
              type="button"
              onClick={() => setSearchText('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          type="button"
          disabled={searchText.trim() === '' && !hasFilters}
          onClick={triggerSearch}
          className="shrink-0"
        >
          <Search className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Search</span>
        </Button>
      </div>

      {/* Mobile: filter button */}
      <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" className="h-10 gap-2 sm:hidden">
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Filters</DialogTitle>
          </DialogHeader>
          {fullModalContent}
        </DialogContent>
      </Dialog>

      {/* Desktop: inline filters */}
      <div className="hidden flex-wrap items-end gap-4 sm:flex">
        <div>
          <Label htmlFor="activity-filter" className="mb-2 block text-sm font-medium">
            Activity
          </Label>
          <Select value={selectedActivity} onValueChange={handleFilterChange(setSelectedActivity)}>
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
          <Label htmlFor="city-filter" className="mb-2 block text-sm font-medium">
            City
          </Label>
          <Select value={selectedCity} onValueChange={handleFilterChange(setSelectedCity)}>
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
          <Label htmlFor="country-filter" className="mb-2 block text-sm font-medium">
            Country
          </Label>
          <Select value={selectedCountry} onValueChange={handleFilterChange(setSelectedCountry)}>
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
          <Label htmlFor="sort-filter" className="mb-2 block text-sm font-medium">
            Sort by
          </Label>
          <Select
            value={sortBy}
            onValueChange={(value) => {
              setSortBy(value as SortBy);
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
  );
}
