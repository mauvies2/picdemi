"use client";

import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState, useTransition } from "react";
import PhotoAlbumViewer, {
  type PhotoAlbumItem,
} from "@/components/photo-album-viewer";
import { Button } from "@/components/ui/button";
import { listMyTaggedPhotos, type TaggedPhotoGroup } from "./actions";

interface TalentPhotosGridProps {
  initialGroups: TaggedPhotoGroup[];
  hasMore: boolean;
}

export function TalentPhotosGrid({
  initialGroups,
  hasMore: initialHasMore,
}: TalentPhotosGridProps) {
  const [groups, setGroups] = useState(initialGroups);
  const [offset, setOffset] = useState(
    initialGroups.reduce(
      (sum, g) => sum + g.dates.reduce((s, d) => s + d.photos.length, 0),
      0,
    ),
  );
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, startTransition] = useTransition();
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleToggleSelect = useCallback((photoId: string) => {
    setSelectedIds((current) => {
      const exists = current.includes(photoId);
      const next = exists
        ? current.filter((id) => id !== photoId)
        : [...current, photoId];
      setIsSelecting(next.length > 0);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
    setIsSelecting(false);
  }, []);

  const selectedCountLabel = useMemo(() => {
    if (selectedIds.length === 0) return "No photos selected";
    if (selectedIds.length === 1) return "1 photo selected";
    return `${selectedIds.length} photos selected`;
  }, [selectedIds.length]);

  // Convert grouped photos to flat PhotoAlbumItem array
  const photoItems = useMemo(() => {
    const items: PhotoAlbumItem[] = [];
    for (const group of groups) {
      for (const dateGroup of group.dates) {
        for (const photo of dateGroup.photos) {
          if (photo.signed_url) {
            items.push({
              id: photo.photo_id,
              url: photo.signed_url,
              alt: `Photo from ${group.event_name || "event"}`,
            });
          }
        }
      }
    }
    return items;
  }, [groups]);

  const handleLoadMore = () => {
    startTransition(async () => {
      try {
        const result = await listMyTaggedPhotos({ limit: 50, offset });
        setGroups((prev) => [...prev, ...result.groups]);
        setOffset(
          (prev) =>
            prev +
            result.groups.reduce(
              (sum, g) =>
                sum + g.dates.reduce((s, d) => s + d.photos.length, 0),
              0,
            ),
        );
        setHasMore(result.hasMore);
      } catch (error) {
        console.error("Failed to load more photos:", error);
      }
    });
  };

  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <p className="text-muted-foreground">
          No photos tagged yet. Photographers will tag you in photos from
          events.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {isSelecting && (
        <div className="flex flex-wrap items-center justify-between gap-3 w-full">
          <div className="text-sm font-medium">{selectedCountLabel}</div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearSelection}
            >
              Clear
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedIds([]);
                setIsSelecting(false);
              }}
            >
              Done
            </Button>
          </div>
        </div>
      )}

      {/* Grouped display */}
      {groups.map((group) => (
        <div key={group.event_id ?? "no-event"}>
          {/* Dates within event */}
          {group.dates.map((dateGroup) => (
            <div key={dateGroup.date}>
              <h3 className="text-2xl font-semibold">
                {dateGroup.date === "unknown"
                  ? "Unknown date"
                  : format(new Date(dateGroup.date), "EEEE, MMMM d, yyyy")}
              </h3>
              <div className="flex items-baseline gap-1">
                <Link
                  href={`/dashboard/events/${group.event_id}`}
                  className="text-sm font-semibold hover:underline"
                >
                  {group.event_name ?? "Uncategorized"}
                </Link>
                <span>{" • "}</span>
                {group.event_date && (
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(group.event_date), "MMMM d, yyyy")}
                  </p>
                )}
                <span>{" • "}</span>
                <p className="text-sm text-muted-foreground">
                  {group.event_city}, {group.event_country}
                </p>
              </div>
              {/* Filter photos for this date group and render with PhotoAlbumViewer */}
              <div className="max-w-full">
                <PhotoAlbumViewer
                  items={photoItems.filter((item) =>
                    dateGroup.photos.some((p) => p.photo_id === item.id),
                  )}
                  selectionMode={isSelecting}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                />
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-8">
          <Button
            onClick={handleLoadMore}
            disabled={isLoading}
            variant="outline"
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
    </div>
  );
}
