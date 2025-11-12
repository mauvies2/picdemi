"use client";

import { Check } from "lucide-react";
import dynamic from "next/dynamic";
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  type Photo,
  type RenderPhotoContext,
  RowsPhotoAlbum,
} from "react-photo-album";
import { cn } from "@/lib/utils";
import "react-photo-album/rows.css";
import "yet-another-react-lightbox/styles.css";

const Lightbox = dynamic(() => import("yet-another-react-lightbox"), {
  ssr: false,
});

export type PhotoAlbumItem = {
  id: string;
  url: string;
  alt?: string;
  width?: number;
  height?: number;
};

type PhotoAlbumViewerProps = {
  items: PhotoAlbumItem[];
  selectionMode?: boolean;
  selectedIds?: string[];
  onToggleSelect?: (photoId: string) => void;
};

export default function PhotoAlbumViewer({
  items,
  selectionMode = false,
  selectedIds,
  onToggleSelect,
}: PhotoAlbumViewerProps) {
  const [index, setIndex] = useState<number>(-1);
  const [dimensions, setDimensions] = useState<
    Record<string, { width: number; height: number }>
  >({});
  const selectedSet = useMemo(() => new Set(selectedIds ?? []), [selectedIds]);
  const canSelect = Boolean(onToggleSelect);
  const selectionActive = selectionMode || selectedSet.size > 0;

  const extractPhotoId = useCallback((photo: Photo & { id?: string }) => {
    if (typeof photo.id === "string" && photo.id.length > 0) return photo.id;
    if (typeof photo.key === "string" && photo.key.length > 0) return photo.key;
    return photo.src;
  }, []);

  useEffect(() => {
    items.forEach((item) => {
      if (dimensions[item.id]) return;
      const img = new window.Image();
      img.onload = () => {
        const width = img.naturalWidth || item.width || 1600;
        const height = img.naturalHeight || item.height || 1066;
        setDimensions((prev) => {
          if (prev[item.id]) return prev;
          return { ...prev, [item.id]: { width, height } };
        });
      };
      img.onerror = () => {
        setDimensions((prev) => {
          if (prev[item.id]) return prev;
          return {
            ...prev,
            [item.id]: {
              width: item.width ?? 1600,
              height: item.height ?? 1066,
            },
          };
        });
      };
      img.src = item.url;
    });
  }, [items, dimensions]);

  const photos: Array<Photo & { id: string }> = useMemo(
    () =>
      items.map((p) => {
        const dims = dimensions[p.id];
        return {
          id: p.id,
          key: p.id,
          src: p.url,
          alt: p.alt ?? "photo",
          width: dims?.width ?? p.width ?? 1600,
          height: dims?.height ?? p.height ?? 1066,
        };
      }),
    [items, dimensions],
  );

  const slides = useMemo(
    () => photos.map((p) => ({ src: p.src, alt: p.alt, id: p.id })),
    [photos],
  );

  const handleToggleSelect = useCallback(
    (photoId: string) => {
      if (!canSelect || !onToggleSelect) return;
      onToggleSelect(photoId);
    },
    [canSelect, onToggleSelect],
  );

  const renderExtras = useCallback(
    (
      _props: object,
      { photo }: RenderPhotoContext<Photo & { id?: string }>,
    ) => {
      const photoId = extractPhotoId(photo);
      const isSelected = selectedSet.has(photoId);

      if (canSelect) {
        return (
          <div className="absolute inset-0 flex items-start justify-start p-2">
            <div
              className={cn(
                "pointer-events-auto flex size-6 items-center justify-center rounded-full bg-background/40 text-muted-foreground opacity-0 shadow-sm transition-all group-hover:opacity-100",
                isSelected &&
                  "opacity-100 bg-primary/40 text-primary-foreground",
              )}
              onClick={(event) => {
                event.stopPropagation();
                handleToggleSelect(photoId);
              }}
              onPointerDown={(event) => {
                event.stopPropagation();
              }}
              aria-hidden="true"
            >
              <Check className="size-3" />
            </div>
          </div>
        );
      }

      return null;
    },
    [extractPhotoId, canSelect, handleToggleSelect, selectedSet],
  );

  return (
    <>
      <RowsPhotoAlbum
        photos={photos}
        spacing={10}
        // breakpoints={[50, 5000, 5000]}
        rowConstraints={{ maxPhotos: 4 }}
        render={{ extras: renderExtras }}
        componentsProps={{
          button: ({ photo }) => {
            const photoId = extractPhotoId(photo as Photo & { id?: string });
            const isSelected = selectedSet.has(photoId);
            return {
              as: "div",
              role: "button",
              tabIndex: 0,
              "data-selected": isSelected ? "" : undefined,
              className: cn(
                "group relative flex h-full w-full overflow-hidden rounded-lg bg-muted p-0 text-left focus:outline-none focus:ring-2 focus:ring-ring/30 selection:ring-0",
                canSelect ? "cursor-pointer" : "cursor-zoom-in",
              ),
              onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  (event.currentTarget as HTMLElement).click();
                }
              },
            };
          },
          image: ({ photo }) => {
            const photoId = extractPhotoId(photo as Photo & { id?: string });
            const isSelected = selectedSet.has(photoId);
            return {
              className: cn(
                "h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]",
                canSelect && isSelected ? "opacity-75" : "",
              ),
            };
          },
        }}
        onClick={({ index, photo }) => {
          const photoId = extractPhotoId(photo as Photo & { id?: string });
          if (canSelect && selectionActive) {
            handleToggleSelect(photoId);
            return;
          }
          setIndex(index);
        }}
      />
      <Lightbox
        open={index >= 0}
        index={index}
        slides={slides}
        render={{
          buttonPrev: undefined,
          buttonNext: undefined,
        }}
        close={() => setIndex(-1)}
      />
    </>
  );
}
