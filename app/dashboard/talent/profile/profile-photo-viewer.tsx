"use client";

import { Download, Share2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type Photo,
  type RenderPhotoContext,
  RowsPhotoAlbum,
} from "react-photo-album";
import { toast } from "sonner";
import {
  PhotoLightbox,
  type PhotoLightboxItem,
} from "@/components/photo-lightbox";
import { cn } from "@/lib/utils";
import { getPhotoDownloadUrl } from "./actions";
import "react-photo-album/rows.css";

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

  const lightboxItems: PhotoLightboxItem[] = useMemo(() => {
    return items.map((item) => {
      const dim = dimensions[item.id] ?? { width: 1600, height: 1066 };
      return {
        id: item.id,
        url: item.url,
        alt: item.alt,
        width: dim.width,
        height: dim.height,
      };
    });
  }, [items, dimensions]);

  const handleDownload = useCallback(
    async (photoId: string) => {
      const metadata = photoMetadata[photoId];
      if (!metadata?.download_url) {
        toast.error("Download URL not available");
        return;
      }

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
      }
    },
    [photoMetadata],
  );

  const handleShare = useCallback(
    async (photoId: string) => {
      const metadata = photoMetadata[photoId];
      if (!metadata) return;

      try {
        // Create URL with photo ID as hash - ensure it's clean
        const baseUrl = window.location.origin + window.location.pathname;
        const shareUrl = `${baseUrl}#photo-${photoId}`;

        // Use Web Share API if available
        if (navigator.share) {
          // Only share the URL to prevent any text from being appended to it
          // Some browsers/apps may concatenate text and URL incorrectly
          const shareData: ShareData = {
            url: shareUrl,
          };

          if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
            toast.success("Shared successfully");
          } else {
            // Fallback: copy to clipboard
            await navigator.clipboard.writeText(shareUrl);
            toast.success("Link copied to clipboard");
          }
        } else {
          // Fallback: copy to clipboard
          await navigator.clipboard.writeText(shareUrl);
          toast.success("Link copied to clipboard");
        }
      } catch (error) {
        // User cancelled or error - fallback to clipboard
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Share error:", error);
          // Try to copy URL as fallback
          try {
            const baseUrl = window.location.origin + window.location.pathname;
            const shareUrl = `${baseUrl}#photo-${photoId}`;
            await navigator.clipboard.writeText(shareUrl);
            toast.success("Link copied to clipboard");
          } catch {
            toast.error("Failed to share");
          }
        }
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(photoId);
                }}
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
              onClick={(e) => {
                e.stopPropagation();
                handleShare(photoId);
              }}
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
      <PhotoLightbox
        items={lightboxItems}
        open={currentIndex >= 0}
        initialIndex={currentIndex >= 0 ? currentIndex : 0}
        onClose={() => onIndexChange(-1)}
        showDownload={true}
        onDownload={(photoId) => {
          handleDownload(photoId);
        }}
        onShare={(photoId) => {
          handleShare(photoId);
        }}
      />

      {/* Custom overlay with photo info and actions */}
      {/* {currentIndex >= 0 && currentMetadata && (
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
      )} */}
    </>
  );
}
