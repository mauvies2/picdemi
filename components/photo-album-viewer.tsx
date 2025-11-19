"use client";

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
import { PhotoIconButtons } from "@/components/photo-icon-buttons";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import "react-photo-album/rows.css";
import "yet-another-react-lightbox/styles.css";

const Lightbox = dynamic(
  () => import("yet-another-react-lightbox").then((mod) => mod.default),
  {
    ssr: false,
  },
);

export type PhotoAlbumItem = {
  id: string;
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  tags?: Array<{
    tag_id: string;
    talent_user_id: string;
    talent_username: string;
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
  showAddToCart?: boolean;
  photosInCart?: Set<string>;
};

export default function PhotoAlbumViewer({
  items,
  selectionMode = false,
  selectedIds,
  onToggleSelect,
  onTagPhoto,
  onUntag,
  showAddToCart = false,
  photosInCart = new Set(),
}: PhotoAlbumViewerProps) {
  const [index, setIndex] = useState<number>(-1);
  const [dimensions, setDimensions] = useState<
    Record<string, { width: number; height: number }>
  >({});
  const [openPopovers, setOpenPopovers] = useState<Set<string>>(new Set());
  const selectedSet = useMemo(() => new Set(selectedIds ?? []), [selectedIds]);
  const canSelect = Boolean(onToggleSelect);
  const selectionActive = selectionMode || selectedSet.size > 0;
  const isMobile = useIsMobile();

  const extractPhotoId = useCallback((photo: Photo & { id?: string }) => {
    if (typeof photo.id === "string" && photo.id.length > 0) return photo.id;
    if (typeof photo.key === "string" && photo.key.length > 0) return photo.key;
    return photo.src;
  }, []);

  useEffect(() => {
    items.forEach((item) => {
      if (dimensions[item.id]) return;
      if (!item.url) {
        console.warn(`Photo ${item.id} has no URL`);
        return;
      }
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
      const isPopoverOpen = openPopovers.has(photoId);

      return (
        <PhotoIconButtons
          photoId={photoId}
          isSelected={isSelected}
          hasTags={tags.length > 0}
          tags={tags}
          isPopoverOpen={isPopoverOpen}
          onPopoverOpenChange={(open) => {
            if (open) {
              setOpenPopovers((prev) => {
                const next = new Set(prev);
                next.add(photoId);
                return next;
              });
            } else {
              setOpenPopovers((prev) => {
                const next = new Set(prev);
                next.delete(photoId);
                return next;
              });
            }
          }}
          canSelect={canSelect}
          onToggleSelect={handleToggleSelect}
          selectionActive={selectionActive}
          onTagPhoto={onTagPhoto}
          onUntag={onUntag}
          showAddToCart={showAddToCart}
          photosInCart={photosInCart}
          isMobile={isMobile}
        />
      );
    },
    [
      extractPhotoId,
      canSelect,
      handleToggleSelect,
      selectedSet,
      items,
      onUntag,
      onTagPhoto,
      openPopovers,
      photosInCart,
      showAddToCart,
      selectionActive,
      isMobile,
    ],
  );

  return (
    <>
      <div className="w-full max-w-full min-w-0">
        <RowsPhotoAlbum
          photos={photos}
          targetRowHeight={250}
          rowConstraints={{ singleRowMaxHeight: 250 }}
          spacing={10}
          // targetRowHeight={200}
          // rowConstraints={{
          //   maxPhotos: 4,
          //   minPhotos: 1,
          //   // singleRowMaxHeight: 200,
          // }}
          render={{
            extras: renderExtras,
            button: (props, { photo }) => {
              const photoId = extractPhotoId(photo as Photo & { id?: string });
              const isSelected = selectedSet.has(photoId);
              const {
                onClick,
                className: propsClassName,
                ...restProps
              } = props;
              return (
                // biome-ignore lint/a11y/useSemanticElements: Intentionally using div to avoid nested buttons
                <div
                  {...(restProps as React.HTMLAttributes<HTMLDivElement>)}
                  onClick={
                    onClick
                      ? (e: React.MouseEvent<HTMLDivElement>) => {
                          onClick(
                            e as unknown as React.MouseEvent<HTMLButtonElement>,
                          );
                        }
                      : undefined
                  }
                  tabIndex={0}
                  role="button"
                  data-selected={isSelected ? "" : undefined}
                  className={cn(
                    "group relative flex h-full w-full overflow-hidden rounded-lg bg-muted p-0 text-left focus:outline-none focus:ring-2 focus:ring-ring/30 selection:ring-0",
                    canSelect ? "cursor-pointer" : "cursor-zoom-in",
                    propsClassName,
                  )}
                  onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onClick?.(
                        event as unknown as React.MouseEvent<HTMLButtonElement>,
                      );
                    }
                  }}
                />
              );
            },
            link: (props, { photo }) => {
              const photoId = extractPhotoId(photo as Photo & { id?: string });
              const isSelected = selectedSet.has(photoId);
              const {
                onClick,
                href,
                className: propsClassName,
                ...restProps
              } = props;
              return (
                // biome-ignore lint/a11y/useSemanticElements: Intentionally using div to avoid nested buttons
                <div
                  {...(restProps as React.HTMLAttributes<HTMLDivElement>)}
                  onClick={
                    onClick
                      ? (e: React.MouseEvent<HTMLDivElement>) => {
                          e.preventDefault();
                          onClick(
                            e as unknown as React.MouseEvent<HTMLAnchorElement>,
                          );
                        }
                      : undefined
                  }
                  tabIndex={0}
                  role="link"
                  data-selected={isSelected ? "" : undefined}
                  aria-label={href}
                  className={cn(
                    "group relative flex h-full w-full overflow-hidden rounded-lg bg-muted p-0 text-left focus:outline-none focus:ring-2 focus:ring-ring/30 selection:ring-0",
                    canSelect ? "cursor-pointer" : "cursor-zoom-in",
                    propsClassName,
                  )}
                  onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onClick?.(
                        event as unknown as React.MouseEvent<HTMLAnchorElement>,
                      );
                    }
                  }}
                />
              );
            },
          }}
          componentsProps={{
            image: ({ photo }) => {
              const photoId = extractPhotoId(photo as Photo & { id?: string });
              const isSelected = selectedSet.has(photoId);
              return {
                className: cn(
                  "h-full w-full object-cover",
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
      </div>
      <Lightbox
        open={index >= 0}
        index={index}
        slides={slides}
        render={{
          buttonPrev: undefined,
          buttonNext: undefined,
          buttonClose: () => (
            <button
              key="lightbox-close-button"
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
                <title>Close</title>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          ),
        }}
        close={() => setIndex(-1)}
      />
    </>
  );
}
