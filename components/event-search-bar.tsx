"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { activityOptions } from "@/app/dashboard/photographer/events/new/activity-options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface EventSearchBarProps {
  variant?: "hero" | "compact";
  initialWhere?: string;
  initialActivity?: string;
  onSearch?: (where: string, activity: string) => void;
  searchHref?: string;
  className?: string;
}

interface ActivityOption {
  value: string;
  label: string;
}

const DROPDOWN_MAX_H = 240;
const DROPDOWN_GAP = 8;

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
    const goUp =
      spaceBelow < DROPDOWN_MAX_H + DROPDOWN_GAP && rect.top > spaceBelow;

    setOpenUpward(goUp);
    setStyle({
      position: "fixed",
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
        "bg-background border shadow-xl overflow-y-auto py-1",
        "max-h-60",
        openUpward
          ? "rounded-t-2xl rounded-b-lg animate-[dropdown-up_0.15s_ease-out]"
          : "rounded-2xl animate-[dropdown-down_0.15s_ease-out]",
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

function useActivityCombobox(
  initialActivity: string,
  sortedActivities: ActivityOption[],
) {
  const initialLabel =
    sortedActivities.find((a) => a.value === initialActivity)?.label ?? "";
  const [inputValue, setInputValue] = useState(initialLabel);
  const [selectedValue, setSelectedValue] = useState(initialActivity || "");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!inputValue.trim()) return sortedActivities;
    return sortedActivities.filter((a) =>
      a.label.toLowerCase().includes(inputValue.toLowerCase()),
    );
  }, [inputValue, sortedActivities]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = useCallback((opt: ActivityOption) => {
    setInputValue(opt.label);
    setSelectedValue(opt.value);
    setError(false);
    setOpen(false);
  }, []);

  const clear = useCallback(() => {
    setInputValue("");
    setSelectedValue("");
    setError(false);
  }, []);

  const validate = useCallback((): string | null => {
    if (!inputValue.trim()) return "";
    const match = sortedActivities.find(
      (a) => a.label.toLowerCase() === inputValue.toLowerCase(),
    );
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

export function EventSearchBar({
  variant = "hero",
  initialWhere = "",
  initialActivity = "",
  onSearch,
  searchHref = "/events",
  className,
}: EventSearchBarProps) {
  const router = useRouter();
  const [where, setWhere] = useState(initialWhere);

  const sortedActivities = useMemo(
    () => [...activityOptions].sort((a, b) => a.label.localeCompare(b.label)),
    [],
  );

  const activity = useActivityCombobox(initialActivity, sortedActivities);

  const handleSearch = useCallback(() => {
    const validatedActivity = activity.validate();
    if (validatedActivity === null) return;

    if (onSearch) {
      onSearch(where, validatedActivity);
      return;
    }
    const params = new URLSearchParams();
    if (where.trim()) params.set("where", where.trim());
    if (validatedActivity) params.set("activity", validatedActivity);
    router.push(`${searchHref}?${params.toString()}`);
  }, [activity, where, onSearch, searchHref, router]);

  if (variant === "hero") {
    return (
      <div className={cn("w-full max-w-xl", className)}>
        <div className="rounded-2xl pl-3 sm:rounded-full border-2 bg-background shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-stretch">
            {/* Where */}
            <div className="flex-1 px-4 pt-4 pb-2 sm:py-0 sm:min-h-[60px] sm:flex sm:flex-col sm:justify-center sm:items-start">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                Where
              </p>
              <input
                id="event-search-where"
                name="where"
                type="text"
                placeholder="Add location or event name"
                value={where}
                onChange={(e) => setWhere(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full h-auto outline-none p-0 mt-0.5 text-base text-muted-foreground font-medium focus-visible:ring-0 shadow-none bg-transparent placeholder:text-muted-foreground/40"
              />
            </div>

            <div className="hidden sm:block w-px bg-border self-stretch my-4" />
            <div className="sm:hidden h-px bg-border mx-5 mt-2" />

            {/* Activity */}
            <div
              ref={activity.containerRef}
              className="relative flex-1 px-5 pt-3 pb-2 sm:py-0 sm:min-h-[60px] sm:flex sm:flex-col sm:justify-center sm:items-start"
            >
              <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                Activity
              </p>
              <input
                id="event-search-activity"
                name="activity"
                type="text"
                placeholder="Any activity"
                value={activity.inputValue}
                onChange={(e) => {
                  activity.setInputValue(e.target.value);
                  activity.setOpen(true);
                }}
                onFocus={() => activity.setOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                  if (e.key === "Escape") activity.setOpen(false);
                }}
                className={cn(
                  "mt-0.5 text-base text-muted-foreground bg-transparent outline-none w-full placeholder:text-muted-foreground/40 transition-all",
                  activity.error &&
                    "animate-[shake_0.35s_ease-in-out] text-destructive placeholder:text-destructive/40",
                )}
              />
              {activity.open &&
                activity.filtered.length > 0 &&
                typeof document !== "undefined" && (
                  <ActivityDropdown
                    filtered={activity.filtered}
                    anchorRef={activity.containerRef}
                    onSelect={activity.select}
                  />
                )}
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
        "flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1.5 hover:bg-muted/60 transition-colors",
        className,
      )}
    >
      <Input
        id="event-search-where-compact"
        name="where"
        placeholder="Where..."
        value={where}
        onChange={(e) => setWhere(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        className="h-6 w-24 border-0 p-0 text-sm focus-visible:ring-0 shadow-none bg-transparent placeholder:text-muted-foreground/50"
      />
      <div className="w-px h-4 bg-border shrink-0" />
      <div ref={activity.containerRef} className="relative">
        <input
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
            if (e.key === "Enter") handleSearch();
            if (e.key === "Escape") activity.setOpen(false);
          }}
          className={cn(
            "h-6 w-24 text-sm bg-transparent outline-none placeholder:text-muted-foreground/50",
            activity.error && "text-destructive",
          )}
        />
        {activity.open &&
          activity.filtered.length > 0 &&
          typeof document !== "undefined" && (
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
