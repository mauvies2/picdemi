'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';
import {
  addPhotoToCartAction,
  removePhotoFromCartAction,
} from '@/app/dashboard/talent/cart/actions';
import PhotoAlbumViewer, { type PhotoAlbumItem } from '@/components/photo-album-viewer';
import { addPhotoToMyPhotosAction, removePhotoFromMyPhotosAction } from './actions';

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
  const router = useRouter();

  const handleAddToPhotos = (photoId: string) => {
    startTransition(async () => {
      try {
        await addPhotoToMyPhotosAction(photoId);
        toast.success('Added to your photos');
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to add photo to your library';
        toast.error(message);
      }
    });
  };

  const handleRemoveFromPhotos = (photoId: string) => {
    startTransition(async () => {
      try {
        await removePhotoFromMyPhotosAction(photoId);
        toast.success('Removed from your photos');
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to remove photo from your library';
        toast.error(message);
      }
    });
  };

  const handleAddToCart = (photoId: string) => {
    startTransition(async () => {
      try {
        await addPhotoToCartAction(photoId);
        toast.success('Added to cart');
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to add photo to cart';
        toast.error(message);
      }
    });
  };

  const handleRemoveFromCart = (photoId: string) => {
    startTransition(async () => {
      try {
        await removePhotoFromCartAction(photoId);
        toast.success('Removed from cart');
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to remove photo from cart';
        toast.error(message);
      }
    });
  };

  return (
    <PhotoAlbumViewer
      items={items}
      showAddToCart={showAddToCart}
      photosInCart={photosInCart}
      onAddToCart={handleAddToCart}
      onRemoveFromCart={handleRemoveFromCart}
      showAddToPhotos={true}
      onAddToPhotos={handleAddToPhotos}
      onRemoveFromPhotos={handleRemoveFromPhotos}
    />
  );
}
