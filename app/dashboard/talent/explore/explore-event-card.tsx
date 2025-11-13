"use client";

import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { activityOptions } from "@/app/dashboard/photographer/events/new/activity-options";

type ExploreEventCardProps = {
  id: string;
  name: string;
  date: string;
  city: string;
  country: string;
  activity: string;
  photoCount: number;
  coverUrl?: string | null;
  pricePerPhoto: number | null;
};

export function ExploreEventCard({
  id,
  name,
  date,
  city,
  country,
  activity,
  photoCount,
  coverUrl,
  pricePerPhoto,
}: ExploreEventCardProps) {
  const activityLabel =
    activityOptions.find((opt) => opt.value === activity)?.label ?? activity;
  const formattedDate = format(new Date(date), "MMM d, yyyy");
  const location = `${city}, ${country}`;
  const priceText =
    pricePerPhoto !== null ? `$${pricePerPhoto.toFixed(2)}/photo` : "Free";

  return (
    <Link
      href={`/events/public/${id}`}
      className="group block rounded-2xl transition-all hover:scale-[1.02] hover:shadow-lg"
    >
      <div className="overflow-hidden rounded-lg bg-muted">
        <div className="relative aspect-square w-full">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={`${name} cover`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-muted to-muted/50 text-sm text-muted-foreground">
              <div className="text-2xl">📸</div>
              <div>No photos yet</div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="absolute bottom-0 left-0 right-0 p-3 text-white opacity-0 transition-opacity group-hover:opacity-100">
            <div className="text-xs font-medium">{photoCount} photos</div>
          </div>
        </div>
      </div>
      <div className="mt-3 space-y-1 px-1">
        <h3 className="line-clamp-1 text-sm font-semibold leading-tight">
          {name}
        </h3>
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span>{formattedDate}</span>
          <span>•</span>
          <span className="line-clamp-1">{location}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {activityLabel}
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            {priceText}
          </span>
        </div>
      </div>
    </Link>
  );
}
