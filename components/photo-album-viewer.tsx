"use client";

import { MoreVertical } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import {
  type Photo,
  type RenderPhotoContext,
  RowsPhotoAlbum,
} from "react-photo-album";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  onDelete?: (photoId: string) => Promise<void>;
};

export default function PhotoAlbumViewer({
  items,
  onDelete,
}: PhotoAlbumViewerProps) {
  const router = useRouter();
  const [index, setIndex] = useState<number>(-1);
  const [dimensions, setDimensions] = useState<
    Record<string, { width: number; height: number }>
  >({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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

  const handleDelete = useCallback(
    (photoId: string) => {
      if (!onDelete) return;
      const confirmed = window.confirm(
        "This will permanently delete the photo. Continue?",
      );
      if (!confirmed) return;

      setPendingId(photoId);
      startTransition(async () => {
        try {
          await onDelete(photoId);
          router.refresh();
        } catch (error) {
          console.error(error);
        } finally {
          setPendingId((current) => (current === photoId ? null : current));
        }
      });
    },
    [onDelete, router],
  );

  const renderExtras = useCallback(
    (
      _props: object,
      { photo }: RenderPhotoContext<Photo & { id?: string }>,
    ) => {
      if (!onDelete) return null;
      const photoId =
        typeof photo.id === "string"
          ? photo.id
          : typeof photo.key === "string"
            ? photo.key
            : photo.src;
      const isProcessing = isPending && pendingId === photoId;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Photo actions"
              disabled={isProcessing}
              onClick={(event) => {
                event.stopPropagation();
              }}
              onPointerDown={(event) => {
                event.stopPropagation();
              }}
              className="pointer-events-none absolute right-2 top-2 flex size-8 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-all group-hover:pointer-events-auto group-hover:opacity-100 group-hover:shadow-sm focus-visible:pointer-events-auto focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              <span className="absolute inset-0 rounded-full bg-background/80 opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100" />
              <MoreVertical className="relative z-10 size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem
              variant="destructive"
              disabled={isProcessing}
              onSelect={(event) => {
                event.stopPropagation();
                handleDelete(photoId);
              }}
            >
              Delete photo
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    [handleDelete, isPending, onDelete, pendingId],
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
          button: () => ({
            as: "div",
            role: "button",
            tabIndex: 0,
            className:
              "group relative flex h-full w-full cursor-pointer overflow-hidden rounded-lg bg-muted p-0 text-left focus:outline-none focus:ring-2 focus:ring-ring/30",
            onKeyDown: (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                (event.currentTarget as HTMLElement).click();
              }
            },
          }),
          image: () => ({
            className:
              "h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]",
          }),
        }}
        onClick={({ index }) => setIndex(index)}
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
