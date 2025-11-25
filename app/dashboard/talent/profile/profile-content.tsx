"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { ProfileData } from "./actions";
import { ProfilePhotoViewer } from "./profile-photo-viewer";

type ProfileContentProps = {
  initialData: ProfileData;
  showSuccessMessage?: boolean;
};

export function ProfileContent({
  initialData,
  showSuccessMessage = false,
}: ProfileContentProps) {
  const { profile, stats, photos } = initialData;
  const [index, setIndex] = useState<number>(-1);
  const router = useRouter();

  useEffect(() => {
    if (showSuccessMessage) {
      toast.success("Purchase successful! Your photos are now available.", {
        duration: 5000,
      });
      // Clean up URL
      router.replace("/dashboard/talent/profile", { scroll: false });
    }
  }, [showSuccessMessage, router]);

  const displayName = profile?.display_name || profile?.username || "User";

  const photoItems = useMemo(() => {
    return photos
      .map((photo) => ({
        id: photo.photo_id,
        url: photo.preview_url ?? "",
        alt: photo.event_name
          ? `Photo from ${photo.event_name}`
          : "Purchased photo",
      }))
      .filter((item) => item.url);
  }, [photos]);

  const photoMetadata = useMemo(() => {
    const metadata: Record<
      string,
      {
        download_url: string | null;
        event_name: string | null;
        event_date: string | null;
        photographer_display_name: string | null;
        photographer_username: string | null;
      }
    > = {};
    photos.forEach((photo) => {
      metadata[photo.photo_id] = {
        download_url: photo.download_url,
        event_name: photo.event_name,
        event_date: photo.event_date,
        photographer_display_name: photo.photographer_display_name,
        photographer_username: photo.photographer_username,
      };
    });
    return metadata;
  }, [photos]);

  return (
    <>
      {/* Instagram-style Profile Header */}
      <div className="border-b pb-8">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Avatar */}
          <div className="flex justify-center sm:justify-start">
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-2 border-border">
              <AvatarImage
                src={profile?.avatar_url ?? undefined}
                alt={displayName}
              />
              <AvatarFallback className="text-3xl sm:text-4xl font-semibold">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Profile Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
              <h1 className="text-2xl sm:text-3xl font-light">{displayName}</h1>
              {/* {profile?.username && (
                <span className="text-sm sm:text-base text-muted-foreground">
                  @{profile.username}
                </span>
              )} */}
            </div>

            {/* Stats */}
            <div className="flex gap-6 sm:gap-8 mb-4">
              <div className="text-center sm:text-left">
                <span className="block text-lg sm:text-xl font-semibold">
                  {stats.purchasedPhotosCount}
                </span>
                <span className="text-sm text-muted-foreground">photos</span>
              </div>
              <div className="text-center sm:text-left">
                <span className="block text-lg sm:text-xl font-semibold">
                  {stats.eventsCount}
                </span>
                <span className="text-sm text-muted-foreground">events</span>
              </div>
            </div>

            {/* Bio */}
            {profile?.bio && (
              <div className="mb-4">
                <p className="text-sm sm:text-base">{profile.bio}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instagram-style Photo Grid */}
      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Image
              src="/logo.svg"
              alt="OceaPic"
              width={48}
              height={48}
              className="opacity-50"
            />
          </div>
          <h3 className="text-lg font-semibold mb-2">No photos yet</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            You haven&apos;t purchased any photos yet. Explore events to find
            yourself and purchase your favorite shots.
          </p>
          <Link href="/dashboard/talent/events">
            <Button>Explore Events</Button>
          </Link>
        </div>
      ) : (
        <div className="w-full pt-4">
          <ProfilePhotoViewer
            items={photoItems}
            photoMetadata={photoMetadata}
            currentIndex={index}
            onIndexChange={setIndex}
          />
        </div>
      )}
    </>
  );
}
