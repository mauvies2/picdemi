"use client";

import { MoreVertical } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type EventCardProps = {
  id: string;
  name: string;
  date: string | null;
  photoCount: number;
  coverUrl?: string | null;
  onDelete: () => Promise<void>;
  editHref: string;
};

export function EventCard({
  id,
  name,
  date,
  photoCount,
  coverUrl,
  onDelete,
  editHref,
}: EventCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const formattedDate = date
    ? new Date(date).toDateString().split(" ").slice(1).join(" ")
    : "";

  const handleDelete = () => {
    const confirmed = window.confirm(
      "This will permanently delete the event and its photos. Continue?",
    );
    if (!confirmed) return;

    startTransition(async () => {
      await onDelete();
      router.refresh();
    });
  };

  const handleEdit = () => {
    router.push(editHref);
  };

  return (
    <div className="group relative">
      <Link
        href={`/dashboard/events/${id}`}
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
        <div className="mt-1 px-1 pb-1">
          <div className="text-sm font-semibold">{name}</div>
          <div className="flex items-center gap-1">
            <p className="text-xs text-muted-foreground">{formattedDate}</p>
            <span className="text-muted-foreground">•</span>
            <p className="text-xs text-muted-foreground">
              {photoCount} {photoCount === 1 ? "photo" : "photos"}
            </p>
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
              handleDelete();
            }}
            variant="destructive"
            disabled={isPending}
          >
            Delete event
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
