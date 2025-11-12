import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";
import { createClient } from "@/database/server";
import {
  getEvent,
  getEventPhotos,
  createSignedUrls,
} from "@/database/queries";
import { EventPhotoAlbum } from "./event-photo-album";
import { getPhotoTags } from "./actions";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect("/login");

  const event = await getEvent(supabase, id, user.id);
  if (!event) return redirect("/dashboard/events");

  const photos = await getEventPhotos(supabase, id, user.id);

  // Generate signed URLs for private storage objects
  const paths = photos.map((p) => p.original_url).filter((url): url is string => url !== null);
  const signed: Record<string, string> = {};

  if (paths.length > 0) {
    const signedUrls = await createSignedUrls(supabase, "photos", paths, 60 * 60); // 1 hour
    for (const item of signedUrls) {
      if (item.signedUrl) {
        signed[item.path] = item.signedUrl;
      }
    }
  }

  // Get tags for all photos
  const photoIds = photos.map((p) => p.id);
  const photoTags = await getPhotoTags(photoIds);

  return (
    <div className="p-4">
      <DashboardHeader title={event.name} />
      <div className="text-sm text-muted-foreground">
        {new Date(event.date)
          .toDateString()
          .split(" ")
          .slice(1)
          .join(" ")}{" "}
        • {event.city[0]?.toUpperCase() + event.city.slice(1)}
      </div>
      <div className="mt-4">
        <EventPhotoAlbum
          items={photos
            .map((p) => {
              const url = p.original_url ? signed[p.original_url] : null;
              if (!url) return null;
              return {
                id: p.id,
                url,
                alt: p.original_url ?? undefined,
                tags: photoTags[p.id] || [],
              };
            })
            .filter(
              (item): item is {
                id: string;
                url: string;
                alt?: string;
                tags: Array<{
                  tag_id: string;
                  talent_user_id: string;
                  talent_email: string;
                  talent_display_name: string | null;
                  tagged_at: string;
                }>;
              } => item !== null,
            )}
        />
      </div>
    </div>
  );
}
