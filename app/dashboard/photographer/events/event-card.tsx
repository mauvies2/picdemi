'use client';

import { MoreVertical } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type EventCardProps = {
  id: string;
  name: string;
  date: string | null;
  photoCount: number;
  salesCount: number;
  isPublic: boolean;
  coverUrl?: string | null;
  onDelete: () => Promise<void>;
  editHref: string;
};

export function EventCard({
  id,
  name,
  date,
  photoCount,
  salesCount,
  isPublic,
  coverUrl,
  onDelete,
  editHref,
}: EventCardProps) {
  const router = useRouter();
  const [isPending] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const formattedDate = date ? new Date(date).toDateString().split(' ').slice(1).join(' ') : '';

  const handleDelete = async () => {
    await onDelete();
    router.refresh();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleEdit = () => {
    router.push(editHref);
  };

  return (
    <div className="group relative">
      <Link
        href={`/dashboard/photographer/events/${id}`}
        className="block rounded-2xl transition-colors"
      >
        <div className="overflow-hidden rounded-lg bg-muted">
          <div className="relative aspect-square w-full">
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt={`${name} cover`}
                fill
                sizes="(max-width: 640px) 100vw, 33vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                No photos
              </div>
            )}
          </div>
        </div>
        <div className="mt-3 px-1 pb-2 space-y-2">
          {/* First row: Title and Badge */}
          <div className="flex items-start gap-2">
            <h3 className="text-sm font-semibold leading-tight line-clamp-2 flex-1 min-w-0">
              {name}
            </h3>
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider shrink-0 ${
                isPublic
                  ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/50 dark:text-green-400'
                  : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400'
              }`}
            >
              {isPublic ? 'Public' : 'Private'}
            </span>
          </div>

          {/* Second row: Date and Stats */}
          <div className="flex items-center justify-between gap-2">
            {/* Left: Date */}
            {formattedDate && <div className="text-xs text-muted-foreground">{formattedDate}</div>}
            {/* Right: Photo count and sales */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
              <span>
                {photoCount} {photoCount === 1 ? 'photo' : 'photos'}
              </span>
              <span className="text-muted-foreground/50">•</span>
              <span>
                {salesCount} {salesCount === 1 ? 'sale' : 'sales'}
              </span>
            </div>
          </div>
        </div>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={isPending}
            aria-label="Open event actions"
            className="pointer-events-none absolute right-2 top-2 flex size-8 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-all group-hover:pointer-events-auto group-hover:opacity-100 group-hover:shadow-sm group-hover:ring-1 group-hover:ring-transparent focus-visible:pointer-events-auto focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            <span className="absolute inset-0 rounded-full bg-muted/60 opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100" />
            <MoreVertical className="relative z-10 size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              handleEdit();
            }}
            disabled={isPending}
          >
            Edit event
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              handleDeleteClick();
            }}
            variant="destructive"
            disabled={isPending}
          >
            Delete event
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Event"
        description="This will permanently delete the event and all its photos. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
