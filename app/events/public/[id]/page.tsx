import { notFound } from "next/navigation";
import { createPhotoUrls, getEventPhotosPublic } from "@/database/queries";
import { createClient } from "@/database/server";
import { getActiveRole } from "@/app/actions/roles";
import { getBaseUrl } from "@/lib/get-base-url";
import PhotoAlbumViewer from "@/components/photo-album-viewer";

export default async function PublicEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Get event by ID - must be public
  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("is_public", true)
    .single();

  if (error || !event) {
    notFound();
  }

  // Check if user is talent (watermark only shows for talent users)
  let useWatermark = false;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { activeRole } = await getActiveRole();
      // Only show watermark for talent users if watermark is enabled
      useWatermark =
        activeRole === "talent" &&
        event.watermark_enabled === true;
    }
  } catch {
    // User not logged in or error - no watermark
    useWatermark = false;
  }

  // Get photos for the event
  const photos = await getEventPhotosPublic(supabase, event.id);

  // Generate URLs (watermarked or regular signed URLs)
  const paths = photos
    .map((p) => p.original_url)
    .filter((url): url is string => url !== null);
  const signed: Record<string, string> = {};

  if (paths.length > 0) {
    const baseUrl = await getBaseUrl();
    const photoUrls = await createPhotoUrls(
      supabase,
      "photos",
      paths,
      {
        expiresIn: 60 * 60, // 1 hour
        useWatermark,
        baseUrl,
      },
    );
    for (const item of photoUrls) {
      if (item.signedUrl) {
        signed[item.path] = item.signedUrl;
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{event.name}</h1>
          <div className="mt-2 text-sm text-muted-foreground">
            {new Date(event.date).toDateString().split(" ").slice(1).join(" ")} •{" "}
            {event.city[0]?.toUpperCase() + event.city.slice(1)}
            {event.price_per_photo !== null && (
              <> • ${event.price_per_photo.toFixed(2)} per photo</>
            )}
          </div>
        </div>

        {photos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No photos available yet.</p>
          </div>
        ) : (
          <PhotoAlbumViewer
            items={photos
              .map((p) => {
                const url = p.original_url ? signed[p.original_url] : null;
                if (!url) return null;
                return {
                  id: p.id,
                  url,
                  ...(p.original_url && { alt: p.original_url }),
                };
              })
              .filter(
                (
                  item,
                ): item is {
                  id: string;
                  url: string;
                  alt?: string;
                } => item !== null,
              )}
          />
        )}
      </div>
    </div>
  );
}

