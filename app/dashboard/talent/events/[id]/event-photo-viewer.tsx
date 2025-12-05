"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import PhotoAlbumViewer, {
  type PhotoAlbumItem,
} from "@/components/photo-album-viewer";
import {
  addPhotoToMyPhotosAction,
  removePhotoFromMyPhotosAction,
} from "./actions";

type EventPhotoViewerProps = {
  items: PhotoAlbumItem[];
  showAddToCart?: boolean;
  photosInCart?: Set<string>;
};

export function EventPhotoViewer({
  items,
  showAddToCart = false,
  photosInCart = new Set(),
}: EventPhotoViewerProps) {
  const [, startTransition] = useTransition();

  const handleAddToPhotos = (photoId: string) => {
    startTransition(async () => {
      try {
        await addPhotoToMyPhotosAction(photoId);
        toast.success("Added to your photos");
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to add photo to your library";
        toast.error(message);
      }
    });
  };

  const handleRemoveFromPhotos = (photoId: string) => {
    startTransition(async () => {
      try {
        await removePhotoFromMyPhotosAction(photoId);
        toast.success("Removed from your photos");
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to remove photo from your library";
        toast.error(message);
      }
    });
  };

  return (
    <PhotoAlbumViewer
      items={items}
      showAddToCart={showAddToCart}
      photosInCart={photosInCart}
      showAddToPhotos={true}
      onAddToPhotos={handleAddToPhotos}
      onRemoveFromPhotos={handleRemoveFromPhotos}
    />
  );
}
