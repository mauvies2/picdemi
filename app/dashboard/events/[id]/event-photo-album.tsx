"use client";

import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import PhotoAlbumViewer, {
  type PhotoAlbumItem,
} from "@/components/photo-album-viewer";
import { TagTalentDialog } from "@/components/tag-talent-dialog";
import { Button } from "@/components/ui/button";

type EventPhotoAlbumProps = {
  items: PhotoAlbumItem[];
};

export function EventPhotoAlbum({ items }: EventPhotoAlbumProps) {
  const router = useRouter();
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);

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

  const handleTagSuccess = useCallback(() => {
    setSelectedIds([]);
    setIsSelecting(false);
    router.refresh();
  }, [router]);

  const handleUntag = useCallback(() => {
    router.refresh();
  }, [router]);

  const handleTagSinglePhoto = useCallback((photoId: string) => {
    setSelectedIds([photoId]);
    setTagDialogOpen(true);
  }, []);

  const selectedCountLabel = useMemo(() => {
    if (selectedIds.length === 0) return "No photos selected";
    if (selectedIds.length === 1) return "1 photo selected";
    return `${selectedIds.length} photos selected`;
  }, [selectedIds.length]);

  return (
    <div className="space-y-3">
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
                variant="default"
                size="sm"
                onClick={() => setTagDialogOpen(true)}
                disabled={selectedIds.length === 0}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Tag talent
              </Button>
              <Button
                type="button"
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
      <PhotoAlbumViewer
        items={items}
        selectionMode={isSelecting}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onTagPhoto={handleTagSinglePhoto}
        onUntag={handleUntag}
      />
      <TagTalentDialog
        open={tagDialogOpen}
        onOpenChange={setTagDialogOpen}
        photoIds={selectedIds}
        onSuccess={handleTagSuccess}
      />
    </div>
  );
}
