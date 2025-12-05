"use client";

import {
  ArrowLeft,
  Download,
  Fullscreen,
  Heart,
  Maximize2,
  Share2,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import { untagPhotoForTalentAction } from "@/app/dashboard/photographer/events/[id]/actions";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type PhotoLightboxItem = {
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

type PhotoLightboxProps = {
  items: PhotoLightboxItem[];
  open: boolean;
  initialIndex?: number;
  onClose: () => void;
  // Button visibility
  showDownload?: boolean;
  showAddToPhotos?: boolean;
  showRemove?: boolean;
  showTagTalent?: boolean;
  // Callbacks
  onDownload?: (photoId: string) => void;
  onShare?: (photoId: string) => void;
  onAddToPhotos?: (photoId: string) => void;
  onRemoveFromPhotos?: (photoId: string) => void;
  onRemove?: (photoId: string) => void;
  onTagTalent?: (photoId: string) => void;
  onUntag?: () => void;
  // Track which photos are in "my photos"
  photosInMyPhotos?: Set<string>;
};

export function PhotoLightbox({
  items,
  open,
  initialIndex = 0,
  onClose,
  showDownload = false,
  showAddToPhotos = false,
  showRemove = false,
  showTagTalent = false,
  onDownload,
  onShare,
  onAddToPhotos,
  onRemoveFromPhotos,
  onRemove,
  onTagTalent,
  onUntag,
  photosInMyPhotos = new Set(),
}: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [addedPhotos, setAddedPhotos] = useState<Set<string>>(new Set());
  const [isTagPopoverOpen, setIsTagPopoverOpen] = useState(false);
  const [isUntagging, startUntagging] = useTransition();

  const currentPhoto = useMemo(
    () => items[currentIndex],
    [items, currentIndex],
  );

  const isInMyPhotos = useMemo(
    () =>
      currentPhoto &&
      (photosInMyPhotos.has(currentPhoto.id) ||
        addedPhotos.has(currentPhoto.id)),
    [currentPhoto, photosInMyPhotos, addedPhotos],
  );

  const hasTags = useMemo(
    () => currentPhoto && (currentPhoto.tags?.length ?? 0) > 0,
    [currentPhoto],
  );

  const handleTagTalent = useCallback(() => {
    if (!currentPhoto || !onTagTalent) return;
    onTagTalent(currentPhoto.id);
  }, [currentPhoto, onTagTalent]);

  const handleUntag = useCallback(
    (talentUserId: string) => {
      if (!currentPhoto) return;
      startUntagging(async () => {
        try {
          await untagPhotoForTalentAction(currentPhoto.id, talentUserId);
          toast.success("Tag removed");
          onUntag?.();
        } catch (error) {
          console.error("Error untagging photo:", error);
          toast.error(
            error instanceof Error ? error.message : "Failed to remove tag",
          );
        }
      });
    },
    [currentPhoto, onUntag],
  );

  // Reset index when opening and prevent body scroll
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      // Prevent body scroll
      document.body.style.overflow = "hidden";
    } else {
      // Restore body scroll
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open, initialIndex]);

  // Navigation handlers - defined early to avoid reference errors
  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
  }, [items.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
  }, [items.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, handlePrevious, handleNext]);

  // Touch/swipe support
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && items.length > 1) {
      handleNext();
    }
    if (isRightSwipe && items.length > 1) {
      handlePrevious();
    }
  };

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }, []);

  const handleDownload = useCallback(() => {
    if (!currentPhoto || !onDownload) return;
    onDownload(currentPhoto.id);
  }, [currentPhoto, onDownload]);

  const handleAddToPhotos = useCallback(() => {
    if (!currentPhoto) return;

    if (isInMyPhotos) {
      // Remove from photos
      if (onRemoveFromPhotos) {
        onRemoveFromPhotos(currentPhoto.id);
      }
      setAddedPhotos((prev) => {
        const next = new Set(prev);
        next.delete(currentPhoto.id);
        return next;
      });
    } else {
      // Add to photos
      if (onAddToPhotos) {
        onAddToPhotos(currentPhoto.id);
      }
      // Optimistically update local state
      setAddedPhotos((prev) => new Set(prev).add(currentPhoto.id));
    }
  }, [currentPhoto, onAddToPhotos, onRemoveFromPhotos, isInMyPhotos]);

  const handleRemove = useCallback(() => {
    if (!currentPhoto || !onRemove) return;
    onRemove(currentPhoto.id);
  }, [currentPhoto, onRemove]);

  const handleShare = useCallback(() => {
    if (!currentPhoto) return;

    // If custom share handler is provided, use it
    if (onShare) {
      onShare(currentPhoto.id);
      return;
    }

    // Default: share the photo URL
    if (!currentPhoto.url) return;

    if (navigator.share) {
      navigator
        .share({
          title: currentPhoto.alt || "Photo",
          url: currentPhoto.url,
        })
        .catch(() => {
          // Fallback to copy
          navigator.clipboard.writeText(currentPhoto.url).catch(() => {});
        });
    } else {
      navigator.clipboard.writeText(currentPhoto.url).catch(() => {});
    }
  }, [currentPhoto, onShare]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  const handleBackdropKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClose();
      }
    },
    [onClose],
  );

  if (!open || !currentPhoto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black"
      style={{ height: "100vh", width: "100vw" }}
      onClick={handleBackdropClick}
      onKeyDown={handleBackdropKeyDown}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      {/* Header Bar */}
      <div
        className="absolute top-0 left-0 right-0 z-30 flex h-16 items-center px-4"
        style={{
          justifyContent: isFullscreen ? "flex-end" : "space-between",
        }}
      >
        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/60 via-black/25  to-transparent" />

        {/* Counter - inside toolbar */}
        {items.length > 1 && (
          <div className="absolute left-1/2 -translate-x-1/2 text-sm text-white pointer-events-none">
            {currentIndex + 1} / {items.length}
          </div>
        )}

        {/* Close button - far left */}
        {!isFullscreen && (
          <div className="relative z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="h-12 w-12 text-white hover:bg-white/15"
              aria-label="Close"
            >
              <X className="h-7 w-7" strokeWidth={1.5} />
            </Button>
          </div>
        )}

        {/* Right side buttons */}
        <div className="relative z-10 flex items-center gap-2">
          {/* Share - always visible */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare();
                }}
                className="h-9 w-9 text-white hover:bg-white/15"
                aria-label="Share"
              >
                <Share2 className="h-5 w-5" strokeWidth={1.5} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Share</p>
            </TooltipContent>
          </Tooltip>

          {/* Download */}
          {showDownload && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload();
                  }}
                  className="h-9 w-9 text-white hover:bg-white/15"
                  aria-label="Download"
                >
                  <Download className="h-5 w-5" strokeWidth={1.5} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Add to Photos */}
          {showAddToPhotos && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToPhotos();
                  }}
                  className="h-9 w-9 text-white hover:bg-white/15"
                  aria-label="Add to photos"
                >
                  <Heart
                    className="h-5 w-5"
                    strokeWidth={1.5}
                    fill={isInMyPhotos ? "white" : "none"}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isInMyPhotos ? "Remove from photos" : "Add to photos"}</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Remove */}
          {showRemove && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove();
                  }}
                  className="h-9 w-9 text-white hover:bg-white/15"
                  aria-label="Remove"
                >
                  <Trash2 className="h-5 w-5" strokeWidth={1.5} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Remove</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Tag Talent / Tagged People */}
          {showTagTalent && (
            <>
              {hasTags ? (
                <Popover
                  open={isTagPopoverOpen}
                  onOpenChange={setIsTagPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-white hover:bg-white/15"
                      aria-label="Tagged people"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <Users className="h-5 w-5" strokeWidth={1.5} />
                      {currentPhoto.tags && currentPhoto.tags.length > 1 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                          {currentPhoto.tags.length}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-64 p-3"
                    side="bottom"
                    align="end"
                    onClick={(e) => e.stopPropagation()}
                    onPointerEnter={(e) => e.stopPropagation()}
                  >
                    <div className="space-y-1.5">
                      {currentPhoto.tags?.map((tag) => (
                        <div
                          key={tag.tag_id}
                          className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm group"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              @{tag.talent_username}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUntag(tag.talent_user_id);
                            }}
                            disabled={isUntagging}
                            className="ml-2 rounded p-1 hover:text-destructive disabled:opacity-50"
                            aria-label={`Remove tag for ${tag.talent_username}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      {onTagTalent && (
                        <div className="border-t pt-1.5 mt-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTagTalent();
                              setIsTagPopoverOpen(false);
                            }}
                            className="flex w-full items-center rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Tag new people
                          </button>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTagTalent();
                      }}
                      className="h-9 w-9 text-white hover:bg-white/15"
                      aria-label="Tag talent"
                    >
                      <UserPlus className="h-5 w-5" strokeWidth={1.5} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tag talent</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </>
          )}

          {/* Fullscreen - always visible */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleFullscreen();
            }}
            className="h-9 w-9 text-white hover:bg-white/15"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <Fullscreen className="h-5 w-5" strokeWidth={1.5} />
            ) : (
              <Maximize2 className="h-5 w-5" strokeWidth={1.5} />
            )}
          </Button>
        </div>
      </div>

      {/* Image Container */}
      <div
        className="relative flex items-center justify-center overflow-hidden"
        style={{
          height: "100vh",
          marginTop: 0,
          paddingTop: isFullscreen ? "4.5rem" : "0",
          paddingBottom: isFullscreen ? "0.5rem" : "0",
          paddingLeft: isFullscreen ? "0.5rem" : "0",
          paddingRight: isFullscreen ? "0.5rem" : "0",
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Previous button */}
        {items.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            className="absolute left-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-all hover:bg-white/15 md:left-8 cursor-pointer"
            aria-label="Previous photo"
          >
            <ArrowLeft className="h-7 w-7" strokeWidth={1.5} />
          </button>
        )}

        {/* Image */}
        <div className="relative w-full h-full" style={{ minHeight: 0 }}>
          <Image
            src={currentPhoto.url}
            alt={currentPhoto.alt || "Photo"}
            fill
            className="object-contain pointer-events-none"
            priority
            sizes="100vw"
            draggable={false}
            unoptimized={
              currentPhoto.url.includes("/api/") ||
              currentPhoto.url.includes("localhost")
            }
          />
        </div>

        {/* Next button */}
        {items.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-all hover:bg-white/15 md:right-8 cursor-pointer"
            aria-label="Next photo"
          >
            <ArrowLeft className="h-7 w-7 rotate-180" strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  );
}
