"use client";

import { format } from "date-fns";
import { Download, Share2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type Photo,
  type RenderPhotoContext,
  RowsPhotoAlbum,
} from "react-photo-album";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getPhotoDownloadUrl } from "./actions";
import "react-photo-album/rows.css";
import "yet-another-react-lightbox/styles.css";

const Lightbox = dynamic(
  () => import("yet-another-react-lightbox").then((mod) => mod.default),
  {
    ssr: false,
  },
);

type ProfilePhotoViewerProps = {
  items: Array<{
    id: string;
    url: string;
    alt?: string;
  }>;
  photoMetadata: Record<
    string,
    {
      download_url: string | null;
      event_name: string | null;
      event_date: string | null;
      photographer_display_name: string | null;
      photographer_username: string | null;
    }
  >;
  currentIndex: number;
  onIndexChange: (index: number) => void;
};

export function ProfilePhotoViewer({
  items,
  photoMetadata,
  currentIndex,
  onIndexChange,
}: ProfilePhotoViewerProps) {
  const [dimensions, setDimensions] = useState<
    Record<string, { width: number; height: number }>
  >({});
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    items.forEach((item) => {
      if (dimensions[item.id]) return;
      if (!item.url) {
        console.warn(`Photo ${item.id} has no URL`);
        return;
      }
      const img = new window.Image();
      img.onload = () => {
        const width = img.naturalWidth || 1600;
        const height = img.naturalHeight || 1066;
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
              width: 1600,
              height: 1066,
            },
          };
        });
      };
      img.src = item.url;
    });
  }, [items, dimensions]);

  const photos = useMemo(() => {
    return items.map((item) => {
      const dim = dimensions[item.id] ?? { width: 1600, height: 1066 };
      return {
        id: item.id,
        src: item.url,
        alt: item.alt,
        width: dim.width,
        height: dim.height,
      };
    });
  }, [items, dimensions]);

  const slides = useMemo(() => {
    return photos.map((photo) => ({
      src: photo.src,
      alt: photo.alt,
      width: photo.width,
      height: photo.height,
    }));
  }, [photos]);

  const currentPhotoId = currentIndex >= 0 ? items[currentIndex]?.id : null;
  const currentMetadata = currentPhotoId ? photoMetadata[currentPhotoId] : null;

  const handleDownload = useCallback(
    async (photoId: string, event?: React.MouseEvent) => {
      if (event) {
        event.stopPropagation();
      }

      const metadata = photoMetadata[photoId];
      if (!metadata?.download_url) {
        toast.error("Download URL not available");
        return;
      }

      setIsDownloading(true);
      try {
        const downloadUrl = await getPhotoDownloadUrl(metadata.download_url);
        if (!downloadUrl) {
          toast.error("Failed to generate download link");
          return;
        }

        // Fetch the image as a blob
        const response = await fetch(downloadUrl);
        if (!response.ok) {
          throw new Error("Failed to fetch image");
        }

        const blob = await response.blob();

        // Create a blob URL and trigger download
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `photo-${photoId}.jpg`;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up the blob URL after a short delay
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 100);

        toast.success("Download started");
      } catch (error) {
        console.error("Download error:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to download photo",
        );
      } finally {
        setIsDownloading(false);
      }
    },
    [photoMetadata],
  );

  const handleShare = useCallback(
    async (photoId: string, event?: React.MouseEvent) => {
      if (event) {
        event.stopPropagation();
      }

      const metadata = photoMetadata[photoId];
      if (!metadata) return;

      setIsSharing(true);
      try {
        const shareUrl = window.location.href;
        const shareData: ShareData = {
          title: metadata.event_name
            ? `Photo from ${metadata.event_name}`
            : "My Photo",
          text: metadata.event_name
            ? `Check out this photo from ${metadata.event_name}`
            : "Check out this photo",
          url: shareUrl,
        };

        // Use Web Share API if available
        if (navigator.share && navigator.canShare(shareData)) {
          await navigator.share(shareData);
          toast.success("Shared successfully");
        } else {
          // Fallback: copy to clipboard
          await navigator.clipboard.writeText(shareUrl);
          toast.success("Link copied to clipboard");
        }
      } catch (error) {
        // User cancelled or error
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Share error:", error);
          toast.error("Failed to share");
        }
      } finally {
        setIsSharing(false);
      }
    },
    [photoMetadata],
  );

  const extractPhotoId = useCallback((photo: Photo & { id?: string }) => {
    if (typeof photo.id === "string" && photo.id.length > 0) return photo.id;
    if (typeof photo.key === "string" && photo.key.length > 0) return photo.key;
    return photo.src;
  }, []);

  const renderExtras = useCallback(
    (
      _props: object,
      { photo }: RenderPhotoContext<Photo & { id?: string }>,
    ) => {
      const photoId = extractPhotoId(photo);
      const metadata = photoMetadata[photoId];

      return (
        <div
          className={cn(
            "absolute inset-0 flex flex-col items-end justify-start p-2",
          )}
        >
          {/* Gradient overlay for better icon contrast */}
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 h-14 bg-linear-to-b from-black/30 via-black/10 to-transparent z-0 opacity-0 transition-opacity group-hover:opacity-100",
            )}
          />

          {/* Download and Share buttons (top right) */}
          <div className="relative z-10 flex w-full items-start justify-end gap-1.5">
            {/* Download button */}
            {metadata?.download_url && (
              // biome-ignore lint/a11y/useSemanticElements: Intentionally using div to avoid nested buttons
              <div
                role="button"
                className={cn(
                  "pointer-events-auto flex size-6 items-center justify-center rounded-full bg-background/70 text-foreground/90 opacity-0 shadow-sm transition-all group-hover:opacity-100 hover:bg-background",
                )}
                onClick={(e) => handleDownload(photoId, e)}
                onKeyDown={(event) => {
                  event.stopPropagation();
                }}
                aria-label="Download photo"
                tabIndex={0}
              >
                <Download className="size-3" />
              </div>
            )}
            {/* Share button */}
            {/* biome-ignore lint/a11y/useSemanticElements: Intentionally using div to avoid nested buttons */}
            <div
              role="button"
              className={cn(
                "pointer-events-auto flex size-6 items-center justify-center rounded-full bg-background/70 text-foreground/90 opacity-0 shadow-sm transition-all group-hover:opacity-100 hover:bg-background",
              )}
              onClick={(e) => handleShare(photoId, e)}
              onKeyDown={(event) => {
                event.stopPropagation();
              }}
              aria-label="Share photo"
              tabIndex={0}
            >
              <Share2 className="size-3" />
            </div>
          </div>
        </div>
      );
    },
    [extractPhotoId, photoMetadata, handleShare, handleDownload],
  );

  return (
    <>
      {/* Photo grid with same style as /dashboard/talent/photos */}
      <div className="w-full max-w-full min-w-0">
        <RowsPhotoAlbum
          photos={photos}
          targetRowHeight={250}
          rowConstraints={{ singleRowMaxHeight: 250 }}
          spacing={10}
          render={{
            extras: renderExtras,
            button: (props) => {
              const {
                onClick,
                className: propsClassName,
                ...restProps
              } = props;
              return (
                <button
                  {...(restProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}
                  onClick={onClick}
                  type="button"
                  className={cn(
                    "group relative flex h-full w-full overflow-hidden rounded-lg bg-muted p-0 text-left focus:outline-none focus:ring-2 focus:ring-ring/30 cursor-zoom-in",
                    propsClassName,
                  )}
                />
              );
            },
          }}
          componentsProps={{
            image: {
              className: "h-full w-full object-cover",
            },
          }}
          onClick={({ index }) => {
            onIndexChange(index);
          }}
        />
      </div>

      {/* Lightbox */}
      <Lightbox
        open={currentIndex >= 0}
        index={currentIndex}
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
              onClick={() => onIndexChange(-1)}
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
        close={() => onIndexChange(-1)}
      />

      {/* Custom overlay with photo info and actions */}
      {currentIndex >= 0 && currentMetadata && (
        <div className="fixed bottom-0 left-0 right-0 z-9998 bg-background/95 backdrop-blur-sm border-t p-4 md:left-auto md:right-4 md:bottom-4 md:w-80 md:rounded-lg md:border md:shadow-lg pointer-events-auto">
          <div className="flex flex-col gap-3">
            {currentMetadata.event_name && (
              <h3 className="font-semibold text-sm">
                {currentMetadata.event_name}
              </h3>
            )}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {currentMetadata.event_date && (
                <span>
                  {format(new Date(currentMetadata.event_date), "MMMM d, yyyy")}
                </span>
              )}
              {currentMetadata.photographer_display_name && (
                <>
                  {currentMetadata.event_date && <span>•</span>}
                  <span>
                    Photo by{" "}
                    {currentMetadata.photographer_display_name ||
                      currentMetadata.photographer_username}
                  </span>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => currentPhotoId && handleDownload(currentPhotoId)}
                disabled={isDownloading || !currentMetadata?.download_url}
                size="sm"
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                {isDownloading ? "Preparing..." : "Download"}
              </Button>
              <Button
                onClick={() => currentPhotoId && handleShare(currentPhotoId)}
                disabled={isSharing || !currentPhotoId}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Share2 className="mr-2 h-4 w-4" />
                {isSharing ? "Sharing..." : "Share"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
