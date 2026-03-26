'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  addPhotoToCartAction,
  removePhotoFromCartAction,
} from '@/app/[lang]/dashboard/talent/cart/actions';
import PhotoAlbumViewer, { type PhotoAlbumItem } from '@/components/photo-album-viewer';
import { addPhotoToMyPhotosAction, removePhotoFromMyPhotosAction } from './actions';

type EventPhotoViewerProps = {
  items: PhotoAlbumItem[];
  showAddToCart?: boolean;
  photosInCart?: Set<string>;
  photosInMyPhotos?: Set<string>;
};

export function EventPhotoViewer({
  items,
  showAddToCart = false,
  photosInCart = new Set(),
  photosInMyPhotos: initialPhotosInMyPhotos = new Set(),
}: EventPhotoViewerProps) {
  const [, startTransition] = useTransition();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Optimistic state for "my photos" — initialized from server prop, updates instantly on click
  const [myPhotos, setMyPhotos] = useState<Set<string>>(initialPhotosInMyPhotos);

  // Sync when server refreshes props (e.g. after router.refresh)
  useEffect(() => {
    setMyPhotos(initialPhotosInMyPhotos);
  }, [initialPhotosInMyPhotos]);

  const handleAddToPhotos = (photoId: string) => {
    setMyPhotos((prev) => new Set([...prev, photoId]));
    startTransition(async () => {
      try {
        await addPhotoToMyPhotosAction(photoId);
        toast.success('Added to my photos');
      } catch (error) {
        setMyPhotos((prev) => {
          const next = new Set(prev);
          next.delete(photoId);
          return next;
        });
        toast.error(error instanceof Error ? error.message : 'Failed to add photo to your library');
      }
    });
  };

  const handleRemoveFromPhotos = (photoId: string) => {
    setMyPhotos((prev) => {
      const next = new Set(prev);
      next.delete(photoId);
      return next;
    });
    startTransition(async () => {
      try {
        await removePhotoFromMyPhotosAction(photoId);
        toast.success('Removed from my photos');
      } catch (error) {
        setMyPhotos((prev) => new Set([...prev, photoId]));
        toast.error(
          error instanceof Error ? error.message : 'Failed to remove photo from your library',
        );
      }
    });
  };

  const handleAddToCart = (photoId: string) => {
    startTransition(async () => {
      try {
        await addPhotoToCartAction(photoId);
        toast.success('Added to cart');
        queryClient.invalidateQueries({ queryKey: ['cart-count'] });
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
        queryClient.invalidateQueries({ queryKey: ['cart-count'] });
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
      photosInMyPhotos={myPhotos}
      onAddToPhotos={handleAddToPhotos}
      onRemoveFromPhotos={handleRemoveFromPhotos}
    />
  );
}
