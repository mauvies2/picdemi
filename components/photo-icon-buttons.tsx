"use client";

import { Check, UserPlus } from "lucide-react";
import { useCallback } from "react";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { PhotoTagsIndicator } from "@/components/photo-tags-indicator";
import { cn } from "@/lib/utils";

interface PhotoIconButtonsProps {
  photoId: string;
  isSelected?: boolean;
  hasTags?: boolean;
  tags?: Array<{
    tag_id: string;
    talent_user_id: string;
    talent_username: string;
    talent_display_name: string | null;
    tagged_at: string;
  }>;
  isPopoverOpen?: boolean;
  onPopoverOpenChange?: (open: boolean) => void;
  // Selection
  canSelect?: boolean;
  onToggleSelect?: (photoId: string) => void;
  selectionActive?: boolean;
  // Tagging
  onTagPhoto?: (photoId: string) => void;
  onUntag?: () => void;
  // Cart
  showAddToCart?: boolean;
  photosInCart?: Set<string>;
  isMobile?: boolean;
  className?: string;
}

export function PhotoIconButtons({
  photoId,
  isSelected = false,
  hasTags = false,
  tags = [],
  isPopoverOpen = false,
  onPopoverOpenChange,
  canSelect = false,
  onToggleSelect,
  selectionActive = false,
  onTagPhoto,
  onUntag,
  showAddToCart = false,
  photosInCart = new Set(),
  isMobile = false,
  className,
}: PhotoIconButtonsProps) {
  const hasAnyOpen = isPopoverOpen;

  const handleToggleSelect = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onToggleSelect?.(photoId);
    },
    [photoId, onToggleSelect],
  );

  const handleTagClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onTagPhoto?.(photoId);
    },
    [photoId, onTagPhoto],
  );

  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col items-start justify-between p-2",
        className,
      )}
    >
      {/* Gradient overlays for better icon contrast */}
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

      {/* Top row: Select and Cart buttons */}
      <div className="relative z-10 flex w-full items-start justify-between">
        {/* Select button (top left) */}
        {canSelect && (
          <div
            className={cn(
              "pointer-events-auto flex size-6 items-center justify-center rounded-full bg-background/70 text-foreground/90 opacity-0 shadow-sm transition-all group-hover:opacity-100 hover:bg-background",
              (isSelected || hasAnyOpen) && "opacity-100",
              isSelected && "bg-background",
            )}
            onClick={handleToggleSelect}
            onPointerDown={(event) => {
              event.stopPropagation();
            }}
            aria-hidden="true"
          >
            <Check className="size-3" />
          </div>
        )}

        {/* Cart button (top right) */}
        <div className="ml-auto flex items-start gap-1.5">
          {showAddToCart && !selectionActive && (
            <div
              className={cn(
                "pointer-events-auto transition-opacity",
                isMobile || photosInCart.has(photoId)
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100",
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
                customSize="size-6"
                className={cn(
                  "rounded-full bg-background/70 text-foreground/90 opacity-0 shadow-sm hover:bg-background group-hover:opacity-100",
                  photosInCart.has(photoId) && "bg-background opacity-100",
                )}
              />
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: Tag/Tagged button (bottom left) */}
      {onTagPhoto && !selectionActive && (
        <div className="pointer-events-auto mt-auto relative z-10">
          {!hasTags ? (
            <button
              type="button"
              className={cn(
                "pointer-events-auto flex size-6 items-center justify-center rounded-full bg-background/70 text-foreground/90 opacity-0 shadow-sm transition-all group-hover:opacity-100 hover:bg-background",
                hasAnyOpen && "opacity-100",
              )}
              onClick={handleTagClick}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="Tag talent"
            >
              <UserPlus className="size-3" />
            </button>
          ) : (
            <PhotoTagsIndicator
              tags={tags}
              photoId={photoId}
              onUntag={onUntag}
              onTagPhoto={onTagPhoto}
              isDropdownOpen={isPopoverOpen}
              onDropdownOpenChange={onPopoverOpenChange}
            />
          )}
        </div>
      )}
    </div>
  );
}
