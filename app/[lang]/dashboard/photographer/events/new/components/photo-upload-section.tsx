'use client';

import { X } from 'lucide-react';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { Dropzone } from '@/components/uploader/Dropzone';

type FilePreview = { id: string; url: string; file: File };

type PhotoUploadSectionProps = {
  previews: FilePreview[];
  error: string | null;
  onFiles: (files: File[]) => void;
  onRemove: (file: File) => void;
};

export function PhotoUploadSection({
  previews,
  error,
  onFiles,
  onRemove,
}: PhotoUploadSectionProps) {
  return (
    <>
      <div className="order-1 flex flex-col gap-2 lg:sticky lg:top-4">
        <Label>Add Photos</Label>
        <Dropzone accept=".jpg,.jpeg,.png,.heic" onSelect={onFiles} className="flex-1 rounded-lg" />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {previews.length > 0 && (
        <div className="order-3 pb-10 space-y-2 mb-5 lg:col-span-2">
          <h3 className="text-lg font-semibold">Event Photos</h3>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
            {previews.map((preview) => (
              <div
                key={preview.id}
                className="group relative aspect-square overflow-visible rounded-lg"
              >
                <div className="absolute inset-0 overflow-hidden rounded-lg border border-dashed border-primary/50 bg-muted">
                  <Image
                    src={preview.url}
                    alt={`Preview ${preview.file.name}`}
                    fill
                    sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 14vw"
                    className="object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(preview.file)}
                  className="absolute -right-1 -top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-foreground/80 text-gray-300 shadow-sm opacity-0 transition-opacity hover:bg-foreground group-hover:opacity-100"
                  aria-label="Remove photo"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
