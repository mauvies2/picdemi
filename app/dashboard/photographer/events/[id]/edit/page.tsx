import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard-header';
import { createSignedUrls, getEvent, getEventPhotos } from '@/database/queries';
import { createClient } from '@/database/server';
import { EditEventForm } from './edit-event-form';

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const event = await getEvent(supabase, id, user.id);

  if (!event) {
    redirect('/dashboard/photographer/events');
  }

  // Get existing photos
  const photos = await getEventPhotos(supabase, id, user.id);

  // Generate signed URLs for photos
  const paths = photos.map((p) => p.original_url).filter((url): url is string => url !== null);
  const signedUrls: Record<string, string> = {};

  if (paths.length > 0) {
    const signed = await createSignedUrls(
      supabase,
      'photos',
      paths,
      60 * 60, // 1 hour
    );
    for (const item of signed) {
      if (item.signedUrl) {
        signedUrls[item.path] = item.signedUrl;
      }
    }
  }

  // Map photos with signed URLs
  const photosWithUrls = photos.map((photo) => ({
    id: photo.id,
    url: photo.original_url ? signedUrls[photo.original_url] : null,
    original_url: photo.original_url,
  }));

  return (
    <div>
      <DashboardHeader title="Edit Event" />
      <p className="mt-1 text-sm text-muted-foreground">
        Update your event details and manage photos.
      </p>
      <div className="mt-6">
        <EditEventForm event={event} initialPhotos={photosWithUrls} />
      </div>
    </div>
  );
}
