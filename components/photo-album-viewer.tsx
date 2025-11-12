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
import { PhotoLightboxTags } from "@/components/photo-lightbox-tags";
import { PhotoTagsIndicator } from "@/components/photo-tags-indicator";
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
  tags?: Array<{
    tag_id: string;
    talent_user_id: string;
    talent_email: string;
    talent_display_name: string | null;
    tagged_at: string;
  }>;
};

type PhotoAlbumViewerProps = {
  items: PhotoAlbumItem[];
  selectionMode?: boolean;
  selectedIds?: string[];
  onToggleSelect?: (photoId: string) => void;
  onTagPhoto?: (photoId: string) => void;
  onUntag?: () => void;
};

export default function PhotoAlbumViewer({
  items,
  selectionMode = false,
  selectedIds,
  onToggleSelect,
  onTagPhoto,
  onUntag,
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
      const photoItem = items.find((item) => item.id === photoId);
      const tags = photoItem?.tags || [];

      return (
        <div className="absolute inset-0 flex flex-col items-start justify-between p-2">
          {canSelect && (
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
          )}
          {tags.length > 0 && (
            <div className="pointer-events-auto mt-auto">
              <PhotoTagsIndicator
                tags={tags}
                photoId={photoId}
                onUntag={onUntag}
              />
            </div>
          )}
        </div>
      );
    },
    [extractPhotoId, canSelect, handleToggleSelect, selectedSet, items, onUntag],
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
          buttonClose: () => (
            <button
              type="button"
              className="yarl__button yarl__button_close"
              aria-label="Close"
              onClick={() => setIndex(-1)}
            >
              <svg
                className="yarl__icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          ),
        }}
        toolbar={{
          render: ({ slide }) => {
            if (!slide.id) return null;
            
            const currentPhoto = items.find((item) => item.id === slide.id);
            const tags = currentPhoto?.tags || [];
            
            return (
              <>
                {tags.length > 0 && (
                  <PhotoLightboxTags
                    key={`tags-${slide.id}`}
                    photoId={slide.id as string}
                    tags={tags}
                    onUntag={onUntag}
                  />
                )}
                {onTagPhoto && (
                  <button
                    key={`tag-btn-${slide.id}`}
                    type="button"
                    className="yarl__button"
                    aria-label="Tag talent"
                    onClick={() => {
                      onTagPhoto(slide.id as string);
                    }}
                    style={{
                      marginRight: "8px",
                    }}
                  >
                    <svg
                      className="yarl__icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{ width: "20px", height: "20px" }}
                    >
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                      <line x1="7" y1="7" x2="7.01" y2="7" />
                    </svg>
                  </button>
                )}
              </>
            );
          },
        }}
        close={() => setIndex(-1)}
      />
    </>
  );
}
