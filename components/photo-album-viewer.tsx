"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { type Photo, RowsPhotoAlbum } from "react-photo-album";
import "react-photo-album/rows.css";
import "yet-another-react-lightbox/styles.css";

const Lightbox = dynamic(() => import("yet-another-react-lightbox"), {
  ssr: false,
});

type Item = {
  id: string;
  url: string;
  alt?: string;
  width?: number;
  height?: number;
};

export default function PhotoAlbumViewer({ items }: { items: Item[] }) {
  const [index, setIndex] = useState<number>(-1);
  const [dimensions, setDimensions] = useState<
    Record<string, { width: number; height: number }>
  >({});

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

  const photos: Photo[] = useMemo(
    () =>
      items.map((p) => {
        const dims = dimensions[p.id];
        return {
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
    () => photos.map((p) => ({ src: p.src, alt: p.alt, id: p.key })),
    [photos],
  );

  return (
    <>
      <RowsPhotoAlbum
        photos={photos}
        spacing={10}
        // breakpoints={[50, 5000, 5000]}
        rowConstraints={{ maxPhotos: 4 }}
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
