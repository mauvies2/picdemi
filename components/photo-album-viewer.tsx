"use client";

import { Check, MoreVertical, UserPlus } from "lucide-react";
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
import { AddToCartButton } from "@/components/add-to-cart-button";
import { PhotoTagsIndicator } from "@/components/photo-tags-indicator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());
  const [openPopovers, setOpenPopovers] = useState<Set<string>>(new Set());
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

      const isDropdownOpen = openDropdowns.has(photoId);
      const isPopoverOpen = openPopovers.has(photoId);
      // Keep icons visible if either is open, preventing flicker during transition
      const hasAnyOpen = isDropdownOpen || isPopoverOpen;

      return (
        <div className="absolute inset-0 flex flex-col items-start justify-between p-2">
          {/* inner gradient overlays for better icon contrast - visible on hover or when dropdowns are open */}
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 h-14 bg-linear-to-b from-black/30 via-black/10 to-transparent z-0 opacity-0 transition-opacity group-hover:opacity-100",
              hasAnyOpen && "opacity-100",
            )}
          />
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-linear-to-t from-black/30 via-black/10 to-transparent z-0 opacity-0 transition-opacity group-hover:opacity-100",
              hasAnyOpen && "opacity-100",
            )}
          />
          <div className="relative z-10 flex w-full items-start justify-between">
            {canSelect && (
              <div
                className={cn(
                  "pointer-events-auto flex size-6 items-center justify-center rounded-full bg-background/60 text-foreground/80 opacity-0 shadow-sm transition-all group-hover:opacity-100",
                  (isSelected || hasAnyOpen) && "opacity-100",
                  isSelected && "bg-primary/40 text-primary-foreground",
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
            <div className="flex items-center gap-1.5">
              {showAddToCart && (
                <div
                  className={cn(
                    "pointer-events-auto opacity-0 transition-opacity group-hover:opacity-100",
                    hasAnyOpen && "opacity-100",
                  )}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <AddToCartButton
                    photoId={photoId}
                    variant="default"
                    size="sm"
                    showText={false}
                    initialInCart={photosInCart.has(photoId)}
                    asDiv={true}
                    className="h-6 rounded-full bg-background/90 text-foreground shadow-sm hover:bg-background"
                  />
                </div>
              )}
              {onTagPhoto && (
                <DropdownMenu
                  open={isDropdownOpen}
                  onOpenChange={(open) => {
                    setOpenDropdowns((prev) => {
                      const next = new Set(prev);
                      if (open) {
                        next.add(photoId);
                      } else {
                        next.delete(photoId);
                      }
                      return next;
                    });
                  }}
                >
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "pointer-events-auto flex size-6 items-center justify-center rounded-full bg-background/60 text-foreground/80 opacity-0 shadow-sm transition-all group-hover:opacity-100 hover:bg-background/70 cursor-pointer",
                        isDropdownOpen && "opacity-100",
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          (e.currentTarget as HTMLElement).click();
                        }
                      }}
                      aria-label="More options"
                    >
                      <MoreVertical className="size-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    onClick={(e) => e.stopPropagation()}
                    onPointerEnter={(e) => e.stopPropagation()}
                  >
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onTagPhoto(photoId);
                      }}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Tag talent
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          {tags.length > 0 && (
            <div className="pointer-events-auto mt-auto relative z-10">
              <PhotoTagsIndicator
                tags={tags}
                photoId={photoId}
                onUntag={onUntag}
                isDropdownOpen={isPopoverOpen}
                onDropdownOpenChange={(open) => {
                  if (open) {
                    // When opening popover, set popover state first, then close dropdown
                    // This ensures hasAnyOpen stays true during transition
                    setOpenPopovers((prev) => {
                      const next = new Set(prev);
                      next.add(photoId);
                      return next;
                    });
                    // Close dropdown after popover is set
                    if (isDropdownOpen) {
                      setOpenDropdowns((prev) => {
                        const next = new Set(prev);
                        next.delete(photoId);
                        return next;
                      });
                    }
                  } else {
                    setOpenPopovers((prev) => {
                      const next = new Set(prev);
                      next.delete(photoId);
                      return next;
                    });
                  }
                }}
              />
            </div>
          )}
        </div>
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
      openDropdowns,
      openPopovers,
      photosInCart,
      showAddToCart,
    ],
  );

  return (
    <>
      <div className="w-full max-w-full min-w-0">
        <RowsPhotoAlbum
          photos={photos}
          spacing={10}
          rowConstraints={{
            maxPhotos: 4,
            minPhotos: 1,
            singleRowMaxHeight: 200,
          }}
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
