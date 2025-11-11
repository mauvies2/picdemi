"use client";

import { useCallback } from "react";
import PhotoAlbumViewer, {
  type PhotoAlbumItem,
} from "@/components/photo-album-viewer";
import { deletePhoto } from "../actions";

type EventPhotoAlbumProps = {
  eventId: string;
  items: PhotoAlbumItem[];
};

export function EventPhotoAlbum({ eventId, items }: EventPhotoAlbumProps) {
  const handleDelete = useCallback(
    async (photoId: string) => {
      await deletePhoto(photoId, eventId);
    },
    [eventId],
  );

  return <PhotoAlbumViewer items={items} onDelete={handleDelete} />;
}
