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
      href={`/dashboard/talent/events/${id}`}
      className="group block rounded-xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-md"
    >
      <div className="overflow-hidden rounded-t-xl bg-muted">
        <div className="relative aspect-square w-full">
          {coverUrl ? (
            <>
              <Image
                src={coverUrl}
                alt={`${name} cover`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="text-xs font-medium text-white drop-shadow-sm">
                  {photoCount} {photoCount === 1 ? "photo" : "photos"}
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-linear-to-br from-muted to-muted/50 text-sm text-muted-foreground">
              <div className="text-2xl">📸</div>
              <div>No photos yet</div>
            </div>
          )}
        </div>
      </div>
      <div className="space-y-1 p-3">
        <h3 className="line-clamp-2 text-base font-semibold leading-tight text-foreground">
          {name}
        </h3>
        <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <span>{formattedDate}</span>
          <span>•</span>
          <span className="line-clamp-1">{location}</span>
        </div>
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            {activityLabel}
          </span>
          <span className="text-sm  text-muted-foreground">{priceText}</span>
        </div>
      </div>
    </Link>
  );
}
