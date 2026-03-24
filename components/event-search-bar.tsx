'use client';

import { format, parseISO } from 'date-fns';
import { CalendarIcon, ChevronLeft, Clock, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { createPortal } from 'react-dom';
import { searchEventNamesAction } from '@/app/dashboard/talent/events/actions';
import { activityOptions } from '@/app/dashboard/photographer/events/new/activity-options';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';

interface EventSearchBarProps {
  variant?: 'hero' | 'compact';
  initialWhere?: string;
  initialActivity?: string;
  initialDateFrom?: string;
  initialDateTo?: string;
  initialPreset?: string;
  initialLat?: number;
  initialLng?: number;
  initialRadius?: number;
  onSearch?: (where: string, activity: string, dateFrom: string, dateTo: string) => void;
  searchHref?: string;
  className?: string;
}

interface ActivityOption {
  value: string;
  label: string;
}

const DROPDOWN_MAX_H = 240;
const DROPDOWN_GAP = 8;

// ─── Date preset helpers ──────────────────────────────────────────────────────

function todayRange(): DateRange {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return { from: d, to: d };
}

function last3DaysRange(): DateRange {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 2);
  from.setHours(0, 0, 0, 0);
  return { from, to };
}

function lastWeekRange(): DateRange {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 6);
  from.setHours(0, 0, 0, 0);
  return { from, to };
}

// ─── Activity dropdown ────────────────────────────────────────────────────────

function ActivityDropdown({
  filtered,
  anchorRef,
  onSelect,
  compact,
}: {
  filtered: ActivityOption[];
  anchorRef: React.RefObject<HTMLDivElement | null>;
  onSelect: (opt: ActivityOption) => void;
  compact?: boolean;
}) {
  const [style, setStyle] = useState<CSSProperties>({ opacity: 0 });
  const [openUpward, setOpenUpward] = useState(false);

  useEffect(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const goUp = spaceBelow < DROPDOWN_MAX_H + DROPDOWN_GAP && rect.top > spaceBelow;

    setOpenUpward(goUp);
    setStyle({
      position: 'fixed',
      left: rect.left,
      width: Math.max(rect.width, compact ? 200 : 220),
      zIndex: 9999,
      ...(goUp
        ? { bottom: window.innerHeight - rect.top + DROPDOWN_GAP }
        : { top: rect.bottom + DROPDOWN_GAP }),
    });
  }, [anchorRef, compact]);

  return createPortal(
    <div
      style={style}
      className={cn(
        'bg-background border shadow-xl overflow-y-auto py-1',
        'max-h-60',
        openUpward
          ? 'rounded-t-2xl rounded-b-lg animate-[dropdown-up_0.15s_ease-out]'
          : 'rounded-2xl animate-[dropdown-down_0.15s_ease-out]',
      )}
    >
      {filtered.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(opt);
          }}
          className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors"
        >
          {opt.label}
        </button>
      ))}
    </div>,
    document.body,
  );
}

// ─── Activity combobox hook ───────────────────────────────────────────────────

function useActivityCombobox(initialActivity: string, sortedActivities: ActivityOption[]) {
  const initialLabel = sortedActivities.find((a) => a.value === initialActivity)?.label ?? '';
  const [inputValue, setInputValue] = useState(initialLabel);
  const [selectedValue, setSelectedValue] = useState(initialActivity || '');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!inputValue.trim()) return sortedActivities;
    return sortedActivities.filter((a) => a.label.toLowerCase().includes(inputValue.toLowerCase()));
  }, [inputValue, sortedActivities]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = useCallback((opt: ActivityOption) => {
    setInputValue(opt.label);
    setSelectedValue(opt.value);
    setError(false);
    setOpen(false);
  }, []);

  const clear = useCallback(() => {
    setInputValue('');
    setSelectedValue('');
    setError(false);
  }, []);

  const validate = useCallback((): string | null => {
    if (!inputValue.trim()) return '';
    const match = sortedActivities.find((a) => a.label.toLowerCase() === inputValue.toLowerCase());
    if (!match) {
      setError(true);
      setTimeout(() => setError(false), 600);
      return null;
    }
    return match.value;
  }, [inputValue, sortedActivities]);

  return {
    inputValue,
    setInputValue,
    selectedValue,
    open,
    setOpen,
    error,
    filtered,
    containerRef,
    select,
    clear,
    validate,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDateStr(s: string): Date | undefined {
  if (!s) return undefined;
  try {
    return parseISO(s);
  } catch {
    return undefined;
  }
}

function whenLabel(from: Date | undefined, to: Date | undefined): string | null {
  if (from && to) {
    const sameDay = format(from, 'yyyy-MM-dd') === format(to, 'yyyy-MM-dd');
    return sameDay ? format(from, 'MMM d') : `${format(from, 'MMM d')} – ${format(to, 'MMM d')}`;
  }
  if (from) return format(from, 'MMM d');
  if (to) return `Until ${format(to, 'MMM d')}`;
  return null;
}

// ─── When popover content ─────────────────────────────────────────────────────

const PRESETS = [
  { label: 'Today', getRange: todayRange },
  { label: 'Last 3 days', getRange: last3DaysRange },
  { label: 'Last week', getRange: lastWeekRange },
] as const;

function WhenPopoverContent({
  dateRange,
  onSelectPreset,
  onSelectCustom,
}: {
  dateRange: DateRange | undefined;
  onSelectPreset: (label: string, range: DateRange) => void;
  onSelectCustom: (range: DateRange | undefined) => void;
}) {
  const [showCalendar, setShowCalendar] = useState(false);

  if (showCalendar) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setShowCalendar(false)}
          className="flex items-center gap-1 px-3 pt-3 pb-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Quick options
        </button>
        <Calendar
          mode="range"
          selected={dateRange}
          onSelect={(range) => {
            onSelectCustom(range);
          }}
          numberOfMonths={1}
        />
      </div>
    );
  }

  return (
    <div className="p-1.5 w-48">
      {PRESETS.map(({ label, getRange }) => (
        <button
          key={label}
          type="button"
          onClick={() => onSelectPreset(label, getRange())}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors text-left"
        >
          <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          {label}
        </button>
      ))}
      <div className="my-1.5 h-px bg-border" />
      <button
        type="button"
        onClick={() => setShowCalendar(true)}
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors text-left"
      >
        <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        Custom date…
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function EventSearchBar({
  variant = 'hero',
  initialWhere = '',
  initialActivity = '',
  initialDateFrom = '',
  initialDateTo = '',
  initialPreset,
  initialLat,
  initialLng,
  initialRadius,
  onSearch,
  searchHref = '/events',
  className,
}: EventSearchBarProps) {
  const router = useRouter();
  const [where, setWhere] = useState(initialWhere);
  const whereRef = useRef<HTMLInputElement>(null);
  const activityInputRef = useRef<HTMLInputElement>(null);

  // If a known preset is passed, recompute its range so "Today" is always fresh
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    if (initialPreset === 'Today') return todayRange();
    if (initialPreset === 'Last 3 days') return last3DaysRange();
    if (initialPreset === 'Last week') return lastWeekRange();
    const from = parseDateStr(initialDateFrom);
    const to = parseDateStr(initialDateTo);
    if (from || to) return { from, to };
    return undefined;
  });

  // Track the preset label (null = any dates / custom)
  const [presetLabel, setPresetLabel] = useState<string | null>(initialPreset ?? null);

  const [searchLat, setSearchLat] = useState<number | undefined>(initialLat);
  const [searchLng, setSearchLng] = useState<number | undefined>(initialLng);
  const [radius, setRadius] = useState<number>(initialRadius ?? (initialLat ? 25 : 0));

  const [whenOpen, setWhenOpen] = useState(false);

  const sortedActivities = useMemo(
    () => [...activityOptions].sort((a, b) => a.label.localeCompare(b.label)),
    [],
  );

  const activity = useActivityCombobox(initialActivity, sortedActivities);

  // Event name suggestions
  const debouncedWhere = useDebounce(where, 250);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const whereContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!debouncedWhere.trim()) {
      setSuggestions([]);
      return;
    }
    searchEventNamesAction(debouncedWhere).then(setSuggestions).catch(() => setSuggestions([]));
  }, [debouncedWhere]);

  const handleSearch = useCallback(() => {
    setShowSuggestions(false);
    const validatedActivity = activity.validate();
    if (validatedActivity === null) return;

    const df = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : '';
    const dt = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : '';

    if (onSearch) {
      onSearch(where, validatedActivity, df, dt);
      return;
    }
    const params = new URLSearchParams();
    if (where.trim()) params.set('where', where.trim());
    if (validatedActivity) params.set('activity', validatedActivity);
    if (df) params.set('dateFrom', df);
    if (dt) params.set('dateTo', dt);
    if (presetLabel) params.set('preset', presetLabel);
    if (searchLat !== undefined && searchLng !== undefined) {
      params.set('lat', searchLat.toFixed(6));
      params.set('lng', searchLng.toFixed(6));
      params.set('radius', radius.toString());
    }
    router.push(`${searchHref}?${params.toString()}`);
  }, [
    activity,
    where,
    dateRange,
    onSearch,
    searchHref,
    router,
    presetLabel,
    searchLat,
    searchLng,
    radius,
  ]);

  const displayLabel = presetLabel ?? whenLabel(dateRange?.from, dateRange?.to);

  const clearDateRange = useCallback(() => {
    setDateRange(undefined);
    setPresetLabel(null);
  }, []);

  const handleSelectPreset = useCallback((label: string, range: DateRange) => {
    setPresetLabel(label);
    setDateRange(range);
    setWhenOpen(false);
  }, []);

  const handleSelectCustom = useCallback((range: DateRange | undefined) => {
    setDateRange(range);
    setPresetLabel(null);
    if (range?.from && range?.to) setWhenOpen(false);
  }, []);

  if (variant === 'hero') {
    return (
      <div className={cn('w-full max-w-3xl', className)}>
        <div className="rounded-2xl pl-3 sm:rounded-full border-2 bg-background shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-stretch">
            {/* Where */}
            <div
              ref={whereContainerRef}
              className="relative flex-1 min-w-0 px-5 pt-4 pb-2 sm:py-0 sm:min-h-[60px] sm:flex sm:flex-col sm:justify-center sm:items-start"
            >
              <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                Name or location
              </p>
              <div className="flex w-full items-center gap-1">
                <input
                  ref={whereRef}
                  id="event-search-where"
                  name="where"
                  type="text"
                  autoComplete="off"
                  placeholder="Add name or location"
                  value={where}
                  onChange={(e) => {
                    setWhere(e.target.value);
                    setSearchLat(undefined);
                    setSearchLng(undefined);
                    setRadius(0);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { setShowSuggestions(false); handleSearch(); }
                    if (e.key === 'Escape') setShowSuggestions(false);
                  }}
                  className="min-w-0 flex-1 h-auto outline-none p-0 mt-0.5 text-base text-muted-foreground font-medium focus-visible:ring-0 shadow-none bg-transparent placeholder:text-muted-foreground/40 [&:-webkit-autofill]:![box-shadow:0_0_0_1000px_white_inset]"
                />
                <button
                  type="button"
                  onClick={() => {
                    setWhere('');
                    setSearchLat(undefined);
                    setSearchLng(undefined);
                    setRadius(0);
                    setSuggestions([]);
                    whereRef.current?.focus();
                  }}
                  className={cn(
                    'mt-0.5 shrink-0 text-muted-foreground hover:text-foreground transition-opacity',
                    where ? 'opacity-100' : 'opacity-0 pointer-events-none',
                  )}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {/* Name suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border bg-popover shadow-lg overflow-hidden">
                  {suggestions.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setWhere(name);
                        setSuggestions([]);
                        setShowSuggestions(false);
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors text-left"
                    >
                      <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="hidden sm:block w-px bg-border self-stretch my-4" />
            <div className="sm:hidden h-px bg-border mx-5 mt-2" />

            {/* Activity */}
            <div
              ref={activity.containerRef}
              className="relative w-[27%] min-w-0 px-5 pt-3 pb-2 sm:py-0 sm:min-h-[60px] sm:flex sm:flex-col sm:justify-center sm:items-start"
            >
              <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                Activity
              </p>
              <div className="flex w-full items-center gap-1">
                <input
                  ref={activityInputRef}
                  id="event-search-activity"
                  name="activity"
                  type="text"
                  placeholder="Add activity"
                  value={activity.inputValue}
                  onChange={(e) => {
                    activity.setInputValue(e.target.value);
                    activity.setOpen(true);
                  }}
                  onFocus={() => activity.setOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch();
                    if (e.key === 'Escape') activity.setOpen(false);
                  }}
                  className={cn(
                    'mt-0.5 text-base text-muted-foreground bg-transparent outline-none min-w-0 flex-1 placeholder:text-muted-foreground/40 transition-all',
                    activity.error &&
                      'animate-[shake_0.35s_ease-in-out] text-destructive placeholder:text-destructive/40',
                  )}
                />
                {activity.inputValue && (
                  <button
                    type="button"
                    onClick={() => {
                      activity.clear();
                      activityInputRef.current?.focus();
                    }}
                    className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {activity.open && activity.filtered.length > 0 && typeof document !== 'undefined' && (
                <ActivityDropdown
                  filtered={activity.filtered}
                  anchorRef={activity.containerRef}
                  onSelect={activity.select}
                />
              )}
            </div>

            <div className="hidden sm:block w-px bg-border self-stretch my-4" />
            <div className="sm:hidden h-px bg-border mx-5 mt-2" />

            {/* When */}
            <div className="relative w-[27%] min-w-0 px-5 pt-3 pb-2 sm:py-0 sm:min-h-[60px] sm:flex sm:flex-col sm:justify-center sm:items-start">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                When
              </p>
              <Popover open={whenOpen} onOpenChange={(o) => setWhenOpen(o)}>
                <div className="mt-0.5 flex w-full items-center gap-1">
                  <PopoverTrigger asChild>
                    <button type="button" className="flex-1 truncate text-left outline-none">
                      <span
                        className={cn(
                          'text-base font-medium',
                          displayLabel ? 'text-muted-foreground' : 'text-muted-foreground/40',
                        )}
                      >
                        {displayLabel ?? 'Add dates'}
                      </span>
                    </button>
                  </PopoverTrigger>
                  {displayLabel ? (
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        clearDateRange();
                      }}
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : (
                    <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                  )}
                </div>
                <PopoverContent className="w-auto p-0" align="start" sideOffset={12}>
                  <WhenPopoverContent
                    dateRange={dateRange}
                    onSelectPreset={handleSelectPreset}
                    onSelectCustom={handleSelectCustom}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Search button */}
            <div className="p-3 sm:p-2.5 sm:flex sm:items-center sm:justify-center">
              <button
                type="button"
                onClick={handleSearch}
                aria-label="Search events"
                className="flex w-full sm:w-10 h-10 shrink-0 items-center justify-center gap-2 rounded-xl sm:rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 active:opacity-80"
              >
                <Search className="h-5 w-5" />
                <span className="sm:hidden text-sm font-semibold">Search</span>
              </button>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%       { transform: translateX(-5px); }
            40%       { transform: translateX(5px); }
            60%       { transform: translateX(-3px); }
            80%       { transform: translateX(3px); }
          }
          @keyframes dropdown-down {
            from { opacity: 0; transform: translateY(-6px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes dropdown-up {
            from { opacity: 0; transform: translateY(6px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  // Compact variant
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1.5 hover:bg-muted/60 transition-colors',
        className,
      )}
    >
      <div className="flex items-center gap-1">
        <Input
          ref={whereRef}
          id="event-search-where-compact"
          name="where"
          placeholder="Where..."
          value={where}
          onChange={(e) => setWhere(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="h-6 w-24 border-0 p-0 text-sm focus-visible:ring-0 shadow-none bg-transparent placeholder:text-muted-foreground/50"
        />
        {where && (
          <button
            type="button"
            onClick={() => {
              setWhere('');
              whereRef.current?.focus();
            }}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="w-px h-4 bg-border shrink-0" />
      <div ref={activity.containerRef} className="relative flex items-center gap-1">
        <input
          ref={activityInputRef}
          id="event-search-activity-compact"
          name="activity"
          placeholder="Activity..."
          value={activity.inputValue}
          onChange={(e) => {
            activity.setInputValue(e.target.value);
            activity.setOpen(true);
          }}
          onFocus={() => activity.setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch();
            if (e.key === 'Escape') activity.setOpen(false);
          }}
          className={cn(
            'h-6 w-24 text-sm bg-transparent outline-none placeholder:text-muted-foreground/50',
            activity.error && 'text-destructive',
          )}
        />
        {activity.inputValue && (
          <button
            type="button"
            onClick={() => {
              activity.clear();
              activityInputRef.current?.focus();
            }}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {activity.open && activity.filtered.length > 0 && typeof document !== 'undefined' && (
          <ActivityDropdown
            filtered={activity.filtered}
            anchorRef={activity.containerRef}
            onSelect={activity.select}
            compact
          />
        )}
      </div>
      <Button
        onClick={handleSearch}
        size="sm"
        className="h-7 w-7 p-0 rounded-full shrink-0"
        aria-label="Search events"
      >
        <Search className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
