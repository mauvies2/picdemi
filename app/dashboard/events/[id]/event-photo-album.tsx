"use client";

import { useCallback, useMemo, useState } from "react";
import PhotoAlbumViewer, {
  type PhotoAlbumItem,
} from "@/components/photo-album-viewer";

type EventPhotoAlbumProps = {
  items: PhotoAlbumItem[];
};

export function EventPhotoAlbum({ items }: EventPhotoAlbumProps) {
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

  return (
    <div className="space-y-3">
      {isSelecting ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-medium">{selectedCountLabel}</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearSelection}
              className="rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedIds([]);
                setIsSelecting(false);
              }}
              className="rounded-md bg-primary px-3 py-1 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Done
            </button>
          </div>
        </div>
      ) : null}
      <PhotoAlbumViewer
        items={items}
        selectionMode={isSelecting}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
      />
    </div>
  );
}
