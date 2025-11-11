import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";
import { createClient } from "@/database/server";
import { EventPhotoAlbum } from "./event-photo-album";

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

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()
    .throwOnError();

  const { data: photos } = await supabase
    .from("photos")
    .select("id, original_url, taken_at, city, country")
    .eq("event_id", id)
    .eq("user_id", user.id)
    .order("taken_at", { ascending: true })
    .throwOnError();
  console.log(photos);
  // Generate signed URLs for private storage objects
  const paths = (photos ?? []).map((p) => p.original_url as string);
  const signed: Record<string, string> = {};

  if (paths.length > 0) {
    const { data: signedUrls } = await supabase.storage
      .from("photos")
      .createSignedUrls(paths, 60 * 60); // 1 hour

    if (signedUrls && signedUrls.length > 0) {
      // Map successful ones and retry individually for failures
      for (const s of signedUrls) {
        const key = s?.path;
        if (key && s?.signedUrl) {
          signed[key] = s.signedUrl;
        }
      }
      // Retry individually where missing
      const missing = paths.filter((p) => !signed[p]);
      for (const p of missing) {
        const { data: one } = await supabase.storage
          .from("photos")
          .createSignedUrl(p, 60 * 60);
        if (one?.signedUrl) {
          signed[p] = one.signedUrl;
        }
      }
    } else {
      // Fallback: sign one-by-one
      for (const p of paths) {
        const { data: one } = await supabase.storage
          .from("photos")
          .createSignedUrl(p, 60 * 60);
        if (one?.signedUrl) {
          signed[p] = one.signedUrl;
        }
      }
    }
  }

  return (
    <div className="p-4">
      <DashboardHeader title={event?.name ?? "Event"} />
      <div className="text-sm text-muted-foreground">
        {new Date(event?.date ?? "")
          .toDateString()
          .split(" ")
          .slice(1)
          .join(" ")}{" "}
        • {event?.city[0]?.toUpperCase() + event?.city?.slice(1)}
      </div>
      <div className="mt-4">
        <EventPhotoAlbum
          items={
            (photos ?? [])
              .map((p) => {
                const url = signed[p.original_url as string];
                if (!url) return null;
                return {
                  id: p.id as string,
                  url,
                  alt: p.original_url as string,
                };
              })
              .filter(Boolean) as { id: string; url: string; alt?: string }[]
          }
        />
      </div>
    </div>
  );
}
