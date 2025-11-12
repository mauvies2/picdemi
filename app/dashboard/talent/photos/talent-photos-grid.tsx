"use client";

import { format } from "date-fns";
import { Check, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { listMyTaggedPhotos, type TaggedPhotoGroup } from "./actions";

const Lightbox = dynamic(() => import("yet-another-react-lightbox"), {
  ssr: false,
});
import "yet-another-react-lightbox/styles.css";

interface TalentPhotosGridProps {
  initialGroups: TaggedPhotoGroup[];
  totalCount: number;
  hasMore: boolean;
}

export function TalentPhotosGrid({
  initialGroups,
  totalCount,
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
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const handleToggleSelect = useCallback((photoId: string) => {
    setSelectedIds((current) => {
      const exists = current.includes(photoId);
      return exists
        ? current.filter((id) => id !== photoId)
        : [...current, photoId];
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

  // Flatten all photos for lightbox
  const allPhotos = useMemo(() => {
    const photos: Array<{ src: string; alt: string; id: string }> = [];
    for (const group of groups) {
      for (const dateGroup of group.dates) {
        for (const photo of dateGroup.photos) {
          if (photo.signed_url) {
            photos.push({
              src: photo.signed_url,
              alt: `Photo from ${group.event_name || "event"}`,
              id: photo.photo_id,
            });
          }
        }
      }
    }
    return photos;
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
    <div className="space-y-12">
      {/* Selection Controls */}
      <div className="flex items-center justify-between">
        {!isSelecting && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsSelecting(true)}
          >
            Select photos
          </Button>
        )}
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
      </div>

      {groups.map((group) => (
        <div key={group.event_id ?? "no-event"} className="space-y-6">
          {/* Event Header */}
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold">
              {group.event_name ?? "Uncategorized"}
            </h2>
            {group.event_date && (
              <p className="text-sm text-muted-foreground">
                {format(new Date(group.event_date), "MMMM d, yyyy")}
                {group.event_city && group.event_country && (
                  <>
                    {" "}
                    • {group.event_city}, {group.event_country}
                  </>
                )}
              </p>
            )}
          </div>

          {/* Dates within event */}
          {group.dates.map((dateGroup) => (
            <div key={dateGroup.date} className="space-y-4">
              <h3 className="text-lg font-medium">
                {dateGroup.date === "unknown"
                  ? "Unknown date"
                  : format(new Date(dateGroup.date), "EEEE, MMMM d, yyyy")}
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {dateGroup.photos.map((photo) => {
                  const globalIndex = allPhotos.findIndex(
                    (p) => p.id === photo.photo_id,
                  );
                  const isSelected = selectedSet.has(photo.photo_id);
                  return (
                    <div
                      key={photo.photo_id}
                      className="group relative aspect-square overflow-hidden rounded-lg bg-muted cursor-pointer focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (isSelecting) {
                            handleToggleSelect(photo.photo_id);
                          } else if (globalIndex >= 0) {
                            setLightboxIndex(globalIndex);
                          }
                        }}
                        className="absolute inset-0"
                      >
                        {photo.signed_url ? (
                          <Image
                            src={photo.signed_url}
                            alt="Tagged photo"
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                            className={cn(
                              "object-cover",
                              isSelecting && isSelected && "opacity-75",
                            )}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                            Loading...
                          </div>
                        )}
                      </button>
                      {isSelecting && (
                        <div className="absolute inset-0 flex items-start justify-start p-2 pointer-events-none">
                          <div
                            className={cn(
                              "pointer-events-auto flex size-6 items-center justify-center rounded-full bg-background/40 text-muted-foreground opacity-0 shadow-sm transition-all group-hover:opacity-100",
                              isSelected &&
                                "opacity-100 bg-primary/40 text-primary-foreground",
                            )}
                          >
                            <Check className="size-3" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
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

      {/* Total count */}
      <div className="text-center text-sm text-muted-foreground">
        Showing{" "}
        {groups.reduce(
          (sum, g) => sum + g.dates.reduce((s, d) => s + d.photos.length, 0),
          0,
        )}{" "}
        of {totalCount} photos
      </div>

      {/* Lightbox */}
      <Lightbox
        open={lightboxIndex >= 0}
        index={lightboxIndex}
        slides={allPhotos.map((p) => ({ src: p.src, alt: p.alt }))}
        close={() => setLightboxIndex(-1)}
      />
    </div>
  );
}
